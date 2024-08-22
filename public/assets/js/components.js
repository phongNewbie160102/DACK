
document.addEventListener("DOMContentLoaded", function () {
    initializeComponents();
});
function initializeComponents() {
    setupDropdowns();
}

function setupDropdowns() {
    const selectWrappers = document.querySelectorAll(".custom-select");

    selectWrappers.forEach(selectWrapper => {
        const trigger = selectWrapper.querySelector(".custom-select-trigger");
        const options = selectWrapper.querySelectorAll(".custom-option");
        const selectedOption = selectWrapper.querySelector(".custom-option.selected");

        if (selectedOption) {
            trigger.querySelector("text").textContent = selectedOption.textContent;
        }

        trigger.addEventListener("click", function () {
            // Đóng tất cả các dropdown khác
            selectWrappers.forEach(wrapper => {
                if (wrapper !== selectWrapper) {
                    wrapper.classList.remove("open");
                }
            });

            const isOpen = selectWrapper.classList.contains("open");
            selectWrapper.classList.toggle("open");

            options.forEach((option, index) => {
                option.style.animationDelay = `${index * 0.1}s`;
                option.style.opacity = isOpen ? 0 : 1;
            });
        });

        selectWrapper.addEventListener("click", function (event) {
            if (event.target.classList.contains("custom-option")) {
                const option = event.target;
                trigger.querySelector("text").textContent = option.textContent;
                selectWrapper.querySelectorAll(".custom-option.selected").forEach(opt => {
                    opt.classList.remove("selected");
                });
                option.classList.add("selected");
                selectWrapper.classList.remove("open");
            }
        });
    });

    document.addEventListener("click", function (event) {
        if (!event.target.closest(".custom-select")) {
            selectWrappers.forEach(selectWrapper => {
                selectWrapper.classList.remove("open");
            });
        }
    });
}
