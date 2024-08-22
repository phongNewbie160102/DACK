(function($) {
  'use strict';

  var WeedoFramework = (function(){
    
    function init(){
      WeedoShortcuts();
      setActiveMenuItem();
      customToggleActions();
      draggableElements('.ms-sortable', '.ms-draggable', 'enable', false);
      sortableLists();

      if($(".ms-quick-bar").length > 0){
        quickBarToggle();
        quickBarConfigure();
        quickBarPopulate();
      }

      customScrollbar();
      tooltipsInit();
      resetPopperPositioning();
      initRoundedProgress();
      notesMemberAppend();
      notesMemberRemove();
      deletableItem();
      addTaskBlockQB();
      addTaskBlockApp();
      addTask();
      confirmTask();
      taskComplete();
      starRating();
      formValidation();
      emailCheckAll();
      emailFlag();
      initDatePickers();
    }

    $(window).on('load', function(){
      $('#preloader-wrap').addClass('loaded');
    });

    function WeedoShortcuts(){
      var quickBarItems = document.getElementsByClassName("ms-quick-bar-item");
      $('body').on('keyup', function(e){
        if(e.keyCode == 27){
          quickBarReset();
        }
        if(e.altKey && e.keyCode == 81){
          $('.ms-configure-qa').trigger('click');
        }
        if(e.altKey && e.keyCode >= 49 && e.keyCode <= 54){
          $(quickBarItems[e.keyCode - 49]).find("a:first-child").trigger('click');
        }
      });
    }

    function setActiveMenuItem(){
      var current = location.pathname.split("/").slice(-1)[0].replace(/^\/|\/$/g, '');
      $('.ms-main-aside .menu-item a', $('#ms-side-nav')).each(function() {
        var $this = $(this);
        if (current === "" || current === "index.php") {
          if ($this.attr('href').indexOf("index.php") !== -1) {
            $(this).addClass('active');
            $(this).parents('.collapse').prev().addClass('active');
            if ($(this).parents('.collapse').length) {
              $(this).closest('.collapse').addClass('show');
            }
          }
        } else {
          if ($this.attr('href').indexOf(current) !== -1) {
            $(this).addClass('active');
            $(this).parents('.collapse').prev().addClass('active');
            if ($(this).parents('.collapse').length) {
              $(this).closest('.collapse').addClass('show');
            }
          }
        }
      });
    }

    function customToggleActions(){
      $(".ms-toggler").bind('click', function(){
        var target = $(this).data('target');
        var toggleType = $(this).data('toggle');

        switch(toggleType) {
        case 'slideLeft':
          $(target).toggleClass('ms-aside-open');
          $(".ms-aside-overlay.ms-overlay-left").toggleClass('d-block');
          $("body").toggleClass('ms-aside-left-open');
          break;
        case 'slideRight':
          $(target).toggleClass('ms-aside-open');
          $(".ms-aside-overlay.ms-overlay-right").toggleClass('d-block');
          break;
        case 'slideDown':
          $(target).toggleClass('ms-slide-down');
          break;
        case 'hideQuickBar':
          quickBarReset();
          break;
        default:
          return;
        }
      });
    }

    function draggableElements(elemToSort, elemToDrag, stateSort, stateDrag){
      $( elemToSort ).sortable({
        scroll: false,
        placeholder: "ui-state-highlight",
        start: function(e, ui){
          ui.placeholder.height(ui.item.height());
          ui.placeholder.width(ui.item.width());
        }
      });
      $( elemToSort ).sortable(stateSort);
      $( elemToDrag ).draggable({
        opacity: 0.75,
        connectToSortable: elemToSort,
        containment: 'parent',
        revert: "invalid",
        disabled: stateDrag,
      });
      $( elemToSort ).disableSelection();
    }

    function quickBarToggle(){
      $(".ms-quick-bar-list").on('click', '.ms-has-qa', function(){
        if( isConfigureMode() == false ){
          $(".ms-quick-bar").addClass("ms-quick-bar-open");
          $('.ms-quick-bar-title').text($(this).data('title'));
        }
      });
    }

    function isConfigureMode(){
      return $('.ms-quick-bar-list').hasClass('ms-qa-configure-mode');
    }

    function quickBarReset(){
      $(".ms-quick-bar").removeClass("ms-quick-bar-open");
      $('.ms-quick-bar-item > a').removeClass('active show');
      $('.ms-quick-bar-item > a').attr('aria-selected', 'false');
      $('.ms-quick-bar > .tab-content .tab-pane').removeClass('active show');
    }

    function quickBarConfigure(){
      var stateSort, stateDrag;
      draggableElements('.ms-quick-bar-list', '.ms-has-qa', 'disable', true);
      $('.ms-configure-qa').on('click', function(e){
        e.preventDefault();
        $('.ms-quick-bar-item a').removeAttr('data-toggle');
        quickBarReset();

        $('.ms-quick-bar-list').toggleClass('ms-qa-configure-mode');
        stateSort = ($('.ms-quick-bar-list').hasClass('ms-qa-configure-mode')) ? "enable" : "disable";
        stateDrag = (stateSort == 'disable') ? true : false;

        if( stateSort == 'disable' ){
          $('.ms-quick-bar-item a').attr('data-toggle', 'tab');
          quickBarSaveLocal();
        }

        draggableElements('.ms-quick-bar-list', '.ms-has-qa', stateSort, stateDrag);
      });
    }

    function quickBarSaveLocal(){
      if(checkReffererProtocol()){
        var quickBarLayout = $('.ms-quick-bar-list')[0].innerHTML;
        storeToLocal('quickbar_layout', quickBarLayout);
      }
    }

    function quickBarPopulate(){
      if(checkReffererProtocol()){
        var localQuickBar = getFromLocal("quickbar_layout");
        if(localQuickBar.length > 0){
          $('.ms-quick-bar-list')[0].innerHTML = localQuickBar;
        }
      }
    }

    function customScrollbar(){
      if( $('.ms-scrollable').length > 0 ){
        $('.ms-scrollable').each(function(){
          var ps = new PerfectScrollbar($(this)[0], {
            maxScrollbarLength : 700,
            wheelPropagation : true
          });
        });
      }
      if( $('.ms-aside-scrollable').length > 0 ){
        var psAside = new PerfectScrollbar($('.ms-aside-scrollable')[0], {
          maxScrollbarLength : 700,
          wheelPropagation : true,
          wheelSpeed : 0.5
        });

        $(".ms-main-aside").on('click', '.has-chevron', function(){
          psAside.update();
        });
      }
    }

    function tooltipsInit(){
      $('body').tooltip({
        selector: '[data-toggle="tooltip"]',
        trigger: 'hover',
        template: '<div class="tooltip" role="tooltip"><div class="tooltip-inner"></div></div>'
      });
    }

    function resetPopperPositioning(){
      Popper.Defaults.modifiers.computeStyle.gpuAcceleration = false;
    }

    function notesMemberAppend(){
      $('.ms-members-list').on('click', 'a', function(){
        var memberSrc = $(this).find('img').attr('src');
        $(this).closest('.ms-card-footer').prev().find('.ms-note-members').append('<li class="ms-deletable"> <img src="' + memberSrc + '" alt="member"> </li>');
      });
    }

    function notesMemberRemove(){
      $('.ms-note-members').on('click', '.ms-deletable', function(){
        $(this).remove();
      });
    }

    function deletableItem(){
      $('body').on('click', '.ms-deletable', function(){
        $(this).closest('.ms-card').fadeOut('slow', function(){ $(this).remove(); });
      });
    }

    function addTaskBlockQB(){
      $('.ms-quick-bar .ms-add-task-block').on('click', function(){
        $(this).before('<form class="ms-task-block">' + 
          '<input type="text" class="form-control" placeholder="Task Name">' + 
          '<button type="submit" class="btn btn-primary w-100">Add</button>' + 
          '</form>');
      });
    }

    function addTaskBlockApp(){
      $('.ms-card-footer').on('click', '.ms-add-task-block', function(){
        $(this).before('<form class="ms-task-block">' + 
          '<input type="text" class="form-control" placeholder="Task Name">' + 
          '<button type="submit" class="btn btn-primary w-100">Add</button>' + 
          '</form>');
      });
    }

    function addTask(){
      $('body').on('submit', '.ms-task-block', function(e){
        e.preventDefault();
        var taskBlockItem = $(this).closest('.ms-card-body').find('.ms-task-block-list').children().eq(0).clone();
        var taskName = $(this).find('input').val();
        if(taskName !== ""){
          taskBlockItem.find('.ms-task-name').text(taskName);
          taskBlockItem.find('input').attr('value', taskName);
          taskBlockItem.removeClass('d-none');
          $(this).closest('.ms-card-body').find('.ms-task-block-list').append(taskBlockItem);
          $(this).remove();
        } else {
          $(this).remove();
        }
      });
    }

    function confirmTask(){
      $('body').on('click', '.ms-confirm-task', function(){
        $(this).closest('.ms-task-block-item').toggleClass('task-complete');
      });
    }

    function taskComplete(){
      $('body').on('click', '.ms-task-block-item', function(){
        $(this).toggleClass('task-complete');
      });
    }

    function starRating(){
      $('.ms-rating').each(function(){
        var rating = $(this).data('rating');
        for(var i = 0; i < rating; i++){
          $(this).find('.fa').eq(i).addClass('fa-star');
        }
      });
    }

    function formValidation(){
      $('form').parsley();
    }

    function emailCheckAll(){
      $('.ms-email-check-all').on('click', function(){
        $(this).toggleClass('checked');
        var checkboxes = $(this).closest('.ms-email-content').find('.ms-email-check');
        checkboxes.prop('checked', $(this).hasClass('checked'));
      });
    }

    function emailFlag(){
      $('.ms-email-star').on('click', function(){
        $(this).toggleClass('starred');
      });
    }

    function initDatePickers(){
      if($('.datepicker').length > 0){
        $('.datepicker').each(function(){
          $(this).datepicker({
            autoclose: true,
            format: "dd/mm/yyyy",
            todayHighlight: true
          });
        });
      }
    }

    return {
      init: init
    }

  })();

  $(document).ready(function(){
    WeedoFramework.init();
  });

})(jQuery);
