if (typeof state === 'undefined') {
    var state = {
        devices: [],
        devices2: [],
        devices3: [],
    };
}
function getRolesFromToken() {
    const token = localStorage.getItem('jwt');
    if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.roles || [];
    }
    return [];
}

function initializePage() {
    // Retrieve and set roles
    const roles = getRolesFromToken();
    const dataRole = document.querySelectorAll('[data-role]');
    dataRole.forEach(element => {
        const elementRoles = element.getAttribute('data-role').split(' ');
        const hasPermission = elementRoles.some(role => roles.includes(role));
        if (!hasPermission) {
            element.style.display = 'none';
        }
    });

    // Setup modals
    const modalConfig = [
        { selector: '.pen1', modalId: 'connectedDevices', callback: null },
        { selector: '.pen2', modalId: 'Bandwidth', callback: displayBWDevices },
        { selector: '.pen3', modalId: 'Violation', callback: null },
        { selector: '.pen4', modalId: 'ActivationServices', callback: null },
        { selector: '.pen5', modalId: 'AllInfoDevice', callback: displayDeviceInfo }
    ];
    function showModal(modalId, callback) {
        const myModal = new bootstrap.Modal(document.getElementById(modalId), {
            keyboard: false
        });
        myModal.show();
        if (callback) callback();
    }
    function hideModal() {
        const closeButtons = document.querySelectorAll('.btn-close');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const modal = button.closest('.modal');
                if (modal) {
  
                    setTimeout(() => {
                        modal.classList.remove('show');
                        modal.style.display = 'none';
                        modal.style.transition = 'opacity 0.1s';
                    }, 10);
    
                    document.body.classList.remove('modal-open');
    
                    // Xử lý backdrop
                    const modalBackdrop = document.querySelector('.modal-backdrop');
                    if (modalBackdrop) {
                        modalBackdrop.style.transition = 'opacity 0.1s';
                        modalBackdrop.style.opacity = '0';
                        document.body.style.paddingRight = '0';
                        setTimeout(() => {
                            modalBackdrop.remove();
                        }, 300);
                    }
                }
            });
        });
    }   
    hideModal();
    modalConfig.forEach(config => {
        const icons = document.querySelectorAll(config.selector);
        icons.forEach(icon => {
            icon.addEventListener('click', () => showModal(config.modalId, config.callback));
        });
    });

    // Fetch data functions
    async function fetchDataAndUpdateCount() {
        try {
            const response = await axios.get('http://localhost:8080/API/tbl_endpoints.php');
            if (response.data && Array.isArray(response.data)) {
                state.devices = response.data;
    
                const connectedDeviceCount = state.devices.reduce((count, device) => {
                    if (device.connection_status === "connected") {
                        return count + 1;
                    }
                    return count;
                }, 0);
    
                const countElement = document.getElementById('connectedDeviceCount');
                if (countElement) {
                    countElement.innerText = connectedDeviceCount + " Devices";
                }
    
                displayDevices();
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }
    
    async function fetchDataConfigSystem() {
        try {
            const response = await axios.get('http://localhost:8080/API/tbl_system_cfg.php');
            if (response.data && Array.isArray(response.data)) {
                state.devices2 = response.data.map((device2, index) => ({
                    ...device2,
                    key: index,
                }));
    
                displayAverageAlarmMessage();
                populateTable();
    
            } else {
                state.devices2 = [];
            }
        } catch (error) {
            state.devices2 = [];
            console.error('Error fetching data:', error);
        }
    }
    
    async function fetchDataServices() {
        try {
            const response = await axios.get('http://localhost:8080/API/tbl_service.php');
            if (response.data && Array.isArray(response.data)) {
                state.devices3 = response.data.map((device3, index) => ({
                    ...device3,
                    key: index,
                }));
    
                // Update the UI
                averageServicesWarning();
                displayServices();
                updateServicesStopped();
            } else {
                state.devices3 = [];
            }
        } catch (error) {
            state.devices3 = [];
            console.error('Error fetching data:', error);
        }
    }
    fetchDataAndUpdateCount();
    fetchDataConfigSystem();
    fetchDataServices();

    // CARD 1 -- Function to calculate and display the average alarm message
    const averageAlarmMessage = () => {
        // Lọc ra các giá trị hợp lệ và chuyển đổi thành số
        const validValues = state.devices2
            .map(device => Number(device.alarm_message))
            .filter(value => !isNaN(value));

        if (validValues.length === 0) return 0;

        // Tính tổng các giá trị hợp lệ
        const total = validValues.reduce((sum, value) => sum + value, 0);

        // Tính trung bình cộng
        return (total / validValues.length).toFixed(0);
    };
    // Function to display devices in the table based on selected option
    function displayDevices() {
        const selectedValue = document.querySelector('.form-select').value;
        const tableBody = document.getElementById('connectedDevicesTableBody');
        if (tableBody) {
            // Clear existing rows
            let rowsHTML = '';
            state.devices.forEach(device => {
                if (selectedValue === 'all' || device.connection_status === selectedValue) {
                    rowsHTML += `
                        <tr>
                            <td class="text-center">
                                ${device.connection_status === 'connected' 
                                    ? '<i class="bi bi-circle-fill" style="color: #1dff50;"></i>' 
                                    : '<i class="bi bi-circle-fill text-secondary"></i>' 
                                }
                            </td>
                            <td class="text-center">${device.id}</td>
                            <td class="text-center">${device.mac_address}</td>
                            <td class="text-center">${device.endpoint_info}</td>
                            <td class="text-center">${device.ip_address}</td>
                            <td class="text-center">${device.last_connection_time}</td>
                            <td class="text-center">${device.total_continuous_connection_time}</td>
                        </tr>
                    `;
                }
            });
            tableBody.innerHTML = rowsHTML;

            $('#devicesTable').DataTable({
                paging: true,  
                pageLength: 5,  
                searching: true,  
                ordering: true,  
                info: true,
                retrieve: true,
            });
        }
    } 
    const selectElement = document.querySelector('.form-select');
    if (selectElement) {
        selectElement.addEventListener('change', () => {
            displayDevices();
        });
    }   

    //CARD 2 
    //Function to display the average alarm message
    function displayAverageAlarmMessage() {
        const averageMessage = averageAlarmMessage();
        const averageElement = document.getElementById('averageAlarmMessage');
        if (averageElement) {
            averageElement.innerText = `${averageMessage} Mbps`;
        }
    }
    const showBWdeviceNormal = () => {
        return state.devices2.filter(device => {
            const alarmMessage = Number(device.alarm_message);
            return !isNaN(alarmMessage) && alarmMessage < 100;
        }).map(device => {
            const endpoint = state.devices.find(d => d.id === device.id);
            return {
                id: device.id,
                endpoint_info: endpoint ? endpoint.endpoint_info : 'N/A',
                ip_address: endpoint ? endpoint.ip_address : 'N/A',
                alarm_message: device.alarm_message
            };
        });
    };
    const showBWdeviceWarning = () => {
        return state.devices2.filter(device => {
            const alarmMessage = Number(device.alarm_message);
            return !isNaN(alarmMessage) && alarmMessage >= 100 && alarmMessage < 200;
        }).map(device => {
            const endpoint = state.devices.find(d => d.id === device.id);
            return {
                id: device.id,
                endpoint_info: endpoint ? endpoint.endpoint_info : 'N/A',
                ip_address: endpoint ? endpoint.ip_address : 'N/A',
                alarm_message: device.alarm_message
            };
        });
    };
    const showBWdeviceCritical = () => {
        return state.devices2.filter(device => {
            const alarmMessage = Number(device.alarm_message);
            return !isNaN(alarmMessage) && alarmMessage >= 300;
        }).map(device => {
            const endpoint = state.devices.find(d => d.id === device.id);
            return {
                id: device.id,
                endpoint_info: endpoint ? endpoint.endpoint_info : 'N/A',
                ip_address: endpoint ? endpoint.ip_address : 'N/A',
                alarm_message: device.alarm_message
            };
        });
    };  
    // Function to display bandwidth devices in the modal
    function displayBWDevices() {
        const bwNormal = showBWdeviceNormal();
        const bwWarning = showBWdeviceWarning();
        const bwCritical = showBWdeviceCritical();
    
        const tableNormalBody = document.getElementById('bwNormalDevicesTableBody');
        const tableWarningBody = document.getElementById('bwWarningDevicesTableBody');
        const tableCriticalBody = document.getElementById('bwCriticalDevicesTableBody');
    
        const dataTableOptions = {
            paging: true,
            pageLength: 5,
            searching: false,
            ordering: true,
            info: false,
            retrieve: true,
        };
    
        if (tableNormalBody) {
            let normalRowsHTML = '';
            bwNormal.forEach(device => {
                normalRowsHTML += `
                    <tr>
                        <td>${device.id}</td>
                        <td>${device.endpoint_info}</td>
                        <td>${device.ip_address}</td>
                        <td class="text-center text-primary">${device.alarm_message} Mbps</td>
                    </tr>
                `;
            });
            tableNormalBody.innerHTML = normalRowsHTML;
    
            if ($.fn.DataTable.isDataTable('#bwNormalTable')) {
                $('#bwNormalTable').DataTable().destroy();
            }
            $('#bwNormalTable').DataTable(dataTableOptions);
        }
    
        if (tableWarningBody) {
            let warningRowsHTML = '';
            bwWarning.forEach(device => {
                warningRowsHTML += `
                    <tr>
                        <td>${device.id}</td>
                        <td>${device.endpoint_info}</td>
                        <td>${device.ip_address}</td>
                        <td class="text-center text-warning">${device.alarm_message} Mbps</td>
                    </tr>
                `;
            });
            tableWarningBody.innerHTML = warningRowsHTML;
    
            if ($.fn.DataTable.isDataTable('#bwWarningTable')) {
                $('#bwWarningTable').DataTable().destroy();
            }
            $('#bwWarningTable').DataTable(dataTableOptions);
        }
    
        if (tableCriticalBody) {
            let criticalRowsHTML = '';
            bwCritical.forEach(device => {
                criticalRowsHTML += `
                    <tr>
                        <td>${device.id}</td>
                        <td>${device.endpoint_info}</td>
                        <td>${device.ip_address}</td>
                        <td class="text-center text-danger">${device.alarm_message} Mbps</td>
                    </tr>
                `;
            });
            tableCriticalBody.innerHTML = criticalRowsHTML;
    
            if ($.fn.DataTable.isDataTable('#bwCriticalTable')) {
                $('#bwCriticalTable').DataTable().destroy();
            }
            $('#bwCriticalTable').DataTable(dataTableOptions);
        }
    }    

    // CARD 3
    // Function to update the UI for stopped services
    function updateServicesStopped() {
        const serviceStopped = state.devices3
            .filter(device3 => device3.alert_level === 'r' && device3.status === 'stopped')
            .map(device3 => ({
                id: device3.id,
                service_name: device3.service_name,
                status: device3.status,
                alert_level: device3.alert_level,
                name_error: device3.name_error
            }));

        // Update the count of stopped services
        const count = serviceStopped.length;
        const averageServices = document.getElementById('countServicesStopped');
        if (averageServices) {
            averageServices.innerText = count > 0 ? `${count} Services` : 'No critical services stopped';
        } else {
            console.error('Element with ID "countServicesStopped" not found.');
        }

        // Update the service stopped table
        const tableBody = document.getElementById('serviceStoppedTableBody');
        if (tableBody) {
            let rowsHTML = '';
            serviceStopped.forEach(device3 => {
                rowsHTML += `
                    <tr>
                        <td class="text-center">${device3.id}</td>
                        <td class="text-center">${device3.alert_level}</td>
                        <td class="text-center">${device3.service_name}</td>
                        <td class="text-center">${device3.status === 'stopped' ? '<span class="text-danger">stopped</span>' : device3.status}</td>
                        <td class="text-center">
                            <span style="
                                color: ${device3.name_error === 'network_connection_error' ? 'red' :
                                    device3.name_error === 'dns_resolution_failure' ? 'orange' :
                                    device3.name_error === 'database_connection_error' ? '#6b1717' :
                                    device3.name_error === 'sip_configuration_error' ? 'purple' :
                                    device3.name_error === 'voip_service_error' ? 'green' :
                                    device3.name_error === 'call_routing_error' ? 'brown' :
                                    device3.name_error === 'access_control_error' ? '#308f8b' :
                                    device3.name_error === 'authentication_error' ? 'gray' :
                                    device3.name_error === 'resource_error' ? 'black' :
                                    'black'  
                                }; font-weight:bold;">
                                ${device3.name_error}
                            </span>
                        </td>
                        <td class="text-center" style="padding-right:21px; padding-left:21px;">
                            <span class="btn btn-sm btn-danger btn-stop" data-id="${device3.id}" style="min-width:0px;" data-toggle="tooltip" data-placement="top" title="Stop">
                                <i class="bi bi-stop-fill"></i>
                            </span>
                            <span class="btn btn-sm btn-primary btn-start" data-id="${device3.id}" style="min-width:0px;" data-toggle="tooltip" data-placement="top" title="Start">
                                <i class="bi bi-play-fill"></i>
                            </span>
                            <span class="btn btn-sm btn-success btn-restart" data-id="${device3.id}" style="min-width:0px;" data-toggle="tooltip" data-placement="top" title="Restart">
                                <i class="bi bi-arrow-repeat"></i>
                            </span>
                        </td>
                    </tr>
                `;
            });
            tableBody.innerHTML = rowsHTML;

            // Ensure DataTables is initialized only once
            if (!$.fn.DataTable.isDataTable('#serviceStoppedTable')) {
                $('#serviceStoppedTable').DataTable({
                    paging: true,
                    pageLength: 5,
                    searching: true,
                    ordering: true,
                    info: false,
                    retrieve: true,
                    columnDefs: [
                        { orderable: false, targets: -1 }  
                    ]
                });

                attachButtonEvents();
            } else {
                // Re-attach button events if DataTables is already initialized
                attachButtonEvents();
            }
        }
    }

    // Function to attach event listeners to the buttons
    function attachButtonEvents() {
        const stopButtons = document.querySelectorAll('.btn-stop');
        stopButtons.forEach(button => {
            button.addEventListener('click', () => {
                const id = button.getAttribute('data-id');
                console.log('Stop button clicked for ID:', id); // Log ID to console
                const device = state.devices3.find(device3 => device3.id === id);
                if (device) {
                    device.status = 'stopped';
                    updateServicesStopped();
                }
            });
        });

        const startButtons = document.querySelectorAll('.btn-start');
        startButtons.forEach(button => {
            button.addEventListener('click', () => {
                const id = button.getAttribute('data-id');
                console.log('Start button clicked for ID:', id); // Log ID to console
                const device = state.devices3.find(device3 => device3.id === id);
                if (device) {
                    device.status = 'running';
                    updateServicesStopped();
                }
            });
        });

        const restartButtons = document.querySelectorAll('.btn-restart');
        restartButtons.forEach(button => {
            button.addEventListener('click', () => {
                const id = button.getAttribute('data-id');
                console.log('Restart button clicked for ID:', id); // Log ID to console
                const device = state.devices3.find(device3 => device3.id === id);
                if (device) {
                    device.status = 'restarting';
                    updateServicesStopped();
                }
            });
        });
    }

    // CARD 4
    // Function to calculate and display the average services warning
    function averageServicesWarning() {
        const count = state.devices3.filter(device3 => device3.alert_level === 'y' && (device3.status === 'stopped' || device3.status === 'running')).length;
        const averageServices = document.getElementById('averageServices');
        if (averageServices) {
            averageServices.innerText = count > 0 ? `${count} Sevices` : 'stopped';
        } else {
            console.error('Element with ID "averageServices" not found.');
        }
    }
    const showServiceGreen = () => {
        return state.devices3.filter(device3 => device3.alert_level === 'gr').map(device3 => ({
            status: device3.status,
            id: device3.id,
            service_name: device3.service_name,
            status: device3.status,
            alert_level: device3.alert_level
        }));
    }
    const showServiceRed = () => {
        return state.devices3.filter(device3 => device3.alert_level === 'r').map(device3 => ({
            id: device3.id,
            service_name: device3.service_name,
            status: device3.status,
            alert_level: device3.alert_level
        }));
    }
    const showServiceYellow = () => {
        return state.devices3.filter(device3 => device3.alert_level === 'y' && device3.status === 'running').map(device3 => ({
            id: device3.id,
            service_name: device3.service_name,
            status: device3.status,
            alert_level: device3.alert_level
        }));
    } 
    // Function to display services in the modal
    function displayServices() {
        const serviceGreen = showServiceGreen();
        const serviceRed = showServiceRed();
        const serviceYellow = showServiceYellow();

        const tableGreenBody = document.getElementById('serviceGreenTableBody');
        const tableRedBody = document.getElementById('serviceRedTableBody');
        const tableYellowBody = document.getElementById('serviceYellowTableBody');

        if (tableGreenBody) {
            let greenRowsHTML = '';
            serviceGreen.forEach(device3 => {
                greenRowsHTML += `
                    <tr>
                        <td class="text-center">${device3.id}</td>
                        <td class="text-center">${device3.service_name}</td>
                        <td class="text-center" class="text-center">${device3.status === 'running' ? '<span class="text-success">running</span>' : device3.status}</td>
                        <td class="text-center">${device3.alert_level}</td>
                    </tr>
                `;
            });
            tableGreenBody.innerHTML = greenRowsHTML;

            $('#serviceGreenTable').DataTable({
                paging: true,  
                pageLength: 5,  
                searching: false,  
                ordering: true,  
                info: false,
                retrieve: true,
            });
        }

        if (tableRedBody) {
            let redRowsHTML = '';
            serviceRed.forEach(device3 => {
                redRowsHTML += `
                    <tr>
                        <td class="text-center">${device3.id}</td>
                        <td class="text-center">${device3.service_name}</td>
                        <td class="text-center">${device3.status === 'stopped' ? '<span class="text-danger">stopped</span>' : device3.status}</td>
                        <td class="text-center">${device3.alert_level}</td>
                    </tr>
                `;
            });
            tableRedBody.innerHTML = redRowsHTML;

            $('#serviceRedTable').DataTable({
                paging: true,  
                pageLength: 5,  
                searching: false,  
                ordering: true,  
                info: false,
                retrieve: true,
            });
        }

        if (tableYellowBody) {
            let yellowRowsHTML = '';
            serviceYellow.forEach(device3 => {
                yellowRowsHTML += `
                    <tr>
                        <td class="text-center">${device3.id}</td>
                        <td class="text-center">${device3.service_name}</td>
                        <td class="text-center">${device3.status === 'stopped' || device3.status === 'running' ? '<span class="text-warning">running</span>' : device3.status}</td>
                        <td class="text-center">${device3.alert_level}</td>
                    </tr>
                `;
            });
            tableYellowBody.innerHTML = yellowRowsHTML;

            $('#serviceYellowTable').DataTable({
                paging: true,  
                pageLength: 5,  
                searching: false,  
                ordering: true,  
                info: false,
                retrieve: true,
            });
        }
    }
    
    // TABLE
    const rowsPerPage = 15; 
    let currentPage = 1;
    
    function populateTable() {
        const tableBody = document.getElementById('tableBody1');
        tableBody.innerHTML = '';
    
        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        const paginatedDevices = state.devices2.slice(start, end);
    
        paginatedDevices.forEach(device2 => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class='text-center'>${device2.id}</td>
                <td class='text-center text-primary pen5' style="cursor:pointer;">${device2.mac_address}</td>
                <td class='text-center text-primary'>${device2.ip_address}</td>
                <td class='text-center'>${device2.connection_type}</td>
                <td class='text-center'>
                    <i class="bi bi-circle-fill fa-xs" style="color: ${device2.connection_status === 'connected' ? '#4ed900' : '#d9d9d9e0'};" data-bs-toggle="tooltip" title="${device2.connection_status === 'connected' ? 'Connected' : 'Disconnected'}"></i>
                </td>
                <td class='text-center'>
                    <i class="bi bi-circle-fill fa-xs" style="color: ${device2.firewall_status.toString() === '1' ? '#4ed900' : '#d9d9d9e0'};" data-bs-toggle="tooltip" title="${device2.firewall_status.toString() === '1' ? 'Firewall Enabled' : 'Firewall Disabled'}"></i>
                </td>
                <td class='text-center'>
                    <i class="bi bi-circle-fill fa-xs" style="color: ${device2.dhcp_status.toString() === '1' ? '#4ed900' : '#d9d9d9e0'};" data-bs-toggle="tooltip" title="${device2.dhcp_status.toString() === '1' ? 'DHCP Enabled' : 'DHCP Disabled'}"></i>
                </td>
                <td class='text-center'>
                    <i class="bi bi-circle-fill fa-xs" style="color: ${device2.routing_status.toString() === '1' ? '#4ed900' : '#d9d9d9e0'};" data-bs-toggle="tooltip" title="${device2.routing_status.toString() === '1' ? 'Routing Enabled' : 'Routing Disabled'}"></i>
                </td>
                <td class='text-center'>
                    <i class="bi bi-circle-fill fa-xs" style="color: ${device2.fxs_vg_modules.toString() === '1' ? '#4ed900' : '#d9d9d9e0'};" data-bs-toggle="tooltip" title="${device2.fxs_vg_modules.toString() === '1' ? 'FXS VG Module Present' : 'No FXS VG Module'}"></i>
                </td>
                <td class='text-center'>
                    <i class="bi bi-circle-fill fa-xs" style="color: ${device2.e1_vg_modules.toString() === '1' ? '#4ed900' : '#d9d9d9e0'};" data-bs-toggle="tooltip" title="${device2.e1_vg_modules.toString() === '1' ? 'E1 VG Module Present' : 'No E1 VG Module'}"></i>
                </td>
            `;
            tableBody.appendChild(row);
            const icon = row.querySelector('.pen5');
            icon.addEventListener('click', () => showModal('AllInfoDevice', () => {
                displayDeviceInfo(device2);
            }));
        });
        updatePagination();
        initSearchAndSortDevices();
    
        // Initialize tooltips
        const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltips.forEach(tooltip => {
            new bootstrap.Tooltip(tooltip);
        });
    }
    
    // Function to display device information in the modal
    function displayDeviceInfo(device2) {
        const modalBody = document.getElementById('modalBodyContent');
        const modalTitle = document.getElementById('exampleModalLabel');
        modalTitle.textContent = `Device: ${device2.id}`;
        // Insert device information
        modalBody.innerHTML = `
            <div class="row">
                <div class="col-4">
                    <table class="nhandonhang">
                        <tbody>
                            <tr class="tr">
                                <th class="th-1">ID</th>
                                <td class="td">${device2.id}</td>
                            </tr>
                            <tr class="tr">
                                <th class="th-1">MAC</th>
                                <td class="td">${device2.mac_address}</td>
                            </tr>
                            <tr class="tr">
                                <th class="th-1">IP</th>
                                <td class="td">${device2.ip_address}</td>
                            </tr>
                            <tr class="tr">
                                <th class="th-1">Connection Type</th>
                                <td class="td">${device2.connection_type}</td>
                            </tr>
                            <tr class="tr">
                                <th class="th-1">Status</th>
                                <td class="td">${device2.connection_status}</td>
                            </tr>
                            <tr class="tr">
                                <th class="th-1">Firewall</th>
                                <td class="td">${device2.firewall_status}</td>
                            </tr>
                            <tr class="tr">
                                <th class="th-1">DHCP</th>
                                <td class="td">${device2.dhcp_status}</td>
                            </tr>
                            <tr class="tr">
                                <th class="th-1">Routing Status</th>
                                <td class="td">${device2.routing_status}</td>
                            </tr>
                            <tr class="tr">
                                <th class="th-1">FXS VG</th>
                                <td class="td">${device2.fxs_vg_modules}</td>
                            </tr>
                            <tr class="tr">
                                <th class="th-1">E1 VG</th>
                                <td class="td">${device2.e1_vg_modules}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="col-8 container">
                    <div class="row p-1">
                        <div class="col-sm-4 chart-container">
                            <canvas id="cpuChart"></canvas>
                        </div>
                        <div class="col-sm-4 chart-container">
                            <canvas id="ramChart"></canvas>
                        </div>
                        <div class="col-sm-4 chart-container">
                            <canvas id="diskChart"></canvas>
                        </div>
                    </div>
                    <div class="row nhandonhang p-1">
                        <div class="col-4"> 
                            <span class="form-control text-center text-primary" style="border-top: 5px solid #3FA2F6;">
                                <h6>Stable</h6>
                                <i class="bi bi-arrow-down-short text-primary"></i>40%
                            </span>
                        </div>
                        <div class="col-4">
                            <span class="form-control text-center text-success" style="border-top: 5px solid #88D66C;">
                                <h6>Warning</h6>
                                <i class="bi bi-arrow-up-short text-success"></i>40%
                            </span>
                        </div>
                        <div class="col-4">
                            <span class="form-control text-center text-danger" style="border-top: 5px solid #FF8343;">
                                <h6>Critical</h6>
                                <i class="bi bi-arrow-up-short text-danger"></i>80%
                            </span>
                        </div>
                    </div>
                    <div class="mt-3">
                        <table class="nhandonhang">
                            <th class="th">Port</th>
                            <th class="th">Total connection time</th>
                            <th class="th">Last connection time</th>
                            <th class="th">Bandwidth</th>
                            <th class="th">System time</th>
                            <tbody>
                                <tr class="tr">
                                    <td class="td">${device2.port_name}</td>
                                    <td class="td">${device2.total_continuous_connection_time}</td>
                                    <td class="td">${device2.last_connection_time}</td>
                                    <td class="td">${device2.bandwidth}</td>
                                    <td class="td">${device2.system_time}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        function getColorForUsage(usagePercent) {
            if (usagePercent > 80) {
                return ['#FF8343', '#e0e0e0'];  
            } else if (usagePercent > 40) {
                return ['#88D66C', '#e0e0e0'];  
            } else {
                return ['#3FA2F6', '#e0e0e0'];  
            }
        }
        
        function addPercentageText(chart, usagePercent) {
            const { ctx, width, height } = chart;
            const text = `${usagePercent}%`;
            ctx.restore();
            ctx.font = 'bold 20px Arial'; 
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#000'; 
            const textX = Math.round((width - ctx.measureText(text).width) / 2);
            const textY = height / 2.2;
            ctx.fillText(text, textX, textY);
            ctx.save();
        }
        
        // Initialize the doughnut charts
        const cpuCtx = document.getElementById('cpuChart').getContext('2d');
        const ramCtx = document.getElementById('ramChart').getContext('2d');
        const diskCtx = document.getElementById('diskChart').getContext('2d');
        
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '75%',  
            plugins: { 
                legend: {
                    position: 'bottom',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.raw.toFixed(0)}%`;
                        }
                    }
                }
            },
            elements: {
                arc: {
                    borderWidth: 1,
                    borderColor: '#fff',  
                }
            },
            animation: {
                onProgress: function() {
                    const chart = this;  
                    const usagePercent = chart.data.datasets[0].data[0];
                    addPercentageText(chart, usagePercent);
                }
            }
        };
        
        new Chart(cpuCtx, {
            type: 'doughnut',
            data: {
                labels: ['CPU Usage', 'Unused'],
                datasets: [{
                    data: [device2.cpu_usage_percent, 100 - device2.cpu_usage_percent],
                    backgroundColor: getColorForUsage(device2.cpu_usage_percent),
                }],
            },
            options: chartOptions,
        });
        
        new Chart(ramCtx, {
            type: 'doughnut',
            data: {
                labels: ['RAM Usage', 'Unused'],
                datasets: [{
                    data: [device2.ram_usage_percent, 100 - device2.ram_usage_percent],
                    backgroundColor: getColorForUsage(device2.ram_usage_percent),
                }],
            },
            options: chartOptions,
        });
        
        new Chart(diskCtx, {
            type: 'doughnut',
            data: {
                labels: ['Disk Usage', 'Unused'],
                datasets: [{
                    data: [device2.disk_usage_percent, 100 - device2.disk_usage_percent],
                    backgroundColor: getColorForUsage(device2.disk_usage_percent),
                }],
            },
            options: chartOptions,
        });
        
        
        
    }

    // Function to show the modal with callback
    function showModal(modalId, callback) {
        const myModal = new bootstrap.Modal(document.getElementById(modalId), {
            keyboard: false
        });
        myModal.show();
        if (callback) callback();
    }

    function updatePagination() {
        const pageIndicator = document.getElementById('pageIndicator');
        pageIndicator.textContent = `Page ${currentPage}`;
        
        const prevButton = document.getElementById('prevPage');
        const nextButton = document.getElementById('nextPage');
        
        prevButton.disabled = currentPage === 1;
        nextButton.disabled = currentPage === Math.ceil(state.devices2.length / rowsPerPage);
    }
    
    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            populateTable();
        }
    });
    
    document.getElementById('nextPage').addEventListener('click', () => {
        if (currentPage < Math.ceil(state.devices2.length / rowsPerPage)) {
            currentPage++;
            populateTable();
        }
    });
    
    document.addEventListener('DOMContentLoaded', () => {
        populateTable();
    });
    
    function initSearchAndSortDevices() {
        const search = document.querySelector('#searchInput');
        if (!search) {
            console.error('Search input not found');
            return;
        }
        
        const table_rows = document.querySelectorAll('#tableBody1 tr');
        const table_headings = document.querySelectorAll('thead th');
        const noResultMessage = document.createElement('div'); 
    
        noResultMessage.textContent = 'No result'; 
        noResultMessage.style.display = 'none';
        noResultMessage.style.textAlign = 'center'; 
        noResultMessage.style.padding = '1rem';
        
        const tableBody = document.querySelector('.table__body');
        if (tableBody) {
            tableBody.appendChild(noResultMessage);
        } else {
            console.error('Table body not found');
            return;
        }
    
        search.addEventListener('input', () => searchTableDevices(search, table_rows, noResultMessage));
    
        table_headings.forEach((head, i) => {
            let sort_asc = true;
            head.addEventListener('click', () => {
                // Xóa lớp active khỏi tất cả tiêu đề và ô
                table_headings.forEach(h => h.classList.remove('active'));
                document.querySelectorAll('td').forEach(td => td.classList.remove('active'));
        
                // Thêm lớp active vào tiêu đề hiện tại và ô tương ứng trong các hàng
                head.classList.add('active');
                table_rows.forEach(row => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length > i) {
                        cells[i].classList.add('active');
                    }
                });
        
                // Chuyển đổi lớp sắp xếp
                head.classList.toggle('asc', sort_asc);
                sort_asc = !sort_asc;
        
                // Sắp xếp bảng
                sortTableDevices(table_rows, i, sort_asc);
            });
        });
        
    }
    
    function searchTableDevices(search, table_rows, noResultMessage) {
        let anyRowVisible = false;
        const searchValue = search.value.toLowerCase();
    
        table_rows.forEach((row, i) => {
            const tableData = row.textContent.toLowerCase();
            const rowShouldBeHidden = !tableData.includes(searchValue);
    
            row.classList.toggle('hide', rowShouldBeHidden);
            row.style.setProperty('--delay', i / 25 + 's');
    
            if (!rowShouldBeHidden) {
                anyRowVisible = true;
            }
        });
    
        document.querySelectorAll('#tableBody1 tr:not(.hide)').forEach((visible_row, i) => {
            visible_row.style.backgroundColor = (i % 2 === 0) ? 'transparent' : '#0000000b';
        });
    
        noResultMessage.style.display = anyRowVisible ? 'none' : 'block';
    }
    
    function sortTableDevices(table_rows, column, sort_asc) {
        const sortedRows = Array.from(table_rows).sort((a, b) => {
            const firstRowCells = a.querySelectorAll('td');
            const secondRowCells = b.querySelectorAll('td');
    
            if (firstRowCells[column] && secondRowCells[column]) {
                const firstRowText = firstRowCells[column].textContent.toLowerCase();
                const secondRowText = secondRowCells[column].textContent.toLowerCase();
                return sort_asc 
                    ? firstRowText.localeCompare(secondRowText) 
                    : secondRowText.localeCompare(firstRowText);
            }
            return 0; // If cells are missing, consider them equal
        });
    
        sortedRows.forEach(sortedRow => document.querySelector('#tableBody1').appendChild(sortedRow));
    }
    
    document.getElementById('findButton').addEventListener('click', () => {
        const bandwidth = document.getElementById('selectBandwidth').value;
        const connectType = document.getElementById('selectFilter2').value;
        const statusDevice = document.getElementById('selectFilter3').value;
        filterTable(bandwidth, connectType, statusDevice);
    });
    
    function filterTable(bandwidth, connectType, statusDevice) {
        const table_rows = document.querySelectorAll('#tableBody1 tr');
        table_rows.forEach(row => {
            const device = state.devices2.find(device => device.id == row.cells[0].innerText);
            let shouldShow = true;
    
            if (bandwidth !== 'allselectBandwidth' && bandwidth !== 'javascript-void(0)') {
                if (bandwidth === '<100' && device.bandwidth >= 100) shouldShow = false;
                if (bandwidth === '[100,200]' && (device.bandwidth <= 100 || device.bandwidth > 200)) shouldShow = false;
                if (bandwidth === '>=300' && device.bandwidth < 300) shouldShow = false;
            }
    
            if (connectType !== 'allConnectType' && connectType !== 'javascript-void(0)') {
                if (device.connection_type !== connectType) shouldShow = false;
            }
        
            if (statusDevice !== 'allStatusDevice' && statusDevice !== 'javascript-void(0)') {
                const statusValue = device.connection_status.toString() === 'connected' ? 'connected' : 'disconnected';
                if (statusValue !== statusDevice) shouldShow = false; 
            }
    
            row.style.display = shouldShow ? '' : 'none';
        });
    }
    // Reload table
    function reloadTable() {
        populateTable();  
    }
    document.getElementById('reloadTableButton').addEventListener('click', reloadTable);

}

