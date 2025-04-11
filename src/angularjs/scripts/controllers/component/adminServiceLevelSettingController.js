angular.module('POOLAGENCY')

.controller('adminServiceLevelSettingController', function($rootScope, $scope, apiGateWay, ngDialog, service, $state, $stateParams,$timeout, $window, auth, configConstant, pendingRequests) {
  $scope.frequencyModel = {
    frequencyType:1,
    deleteAfterType:1,
    frequency:null,
    deleteAfter:null,
    endDate:null
  }
  $scope.poolTypeModel = [];
  $scope.currentFilterPoolType = 1;
  $scope.serviceLevelArray = [];
  $scope.serviceLevelArrayCache = [];
  $scope.updateTabScroll();
  $rootScope.settingPageLoaders.serviceLevelSection = true;
  apiGateWay.get("/get_service_level").then(function(response) {
    if(response.status == 200) {
      $rootScope.settingPageLoaders.serviceLevelSection = false;
      level = $rootScope.sortServiceLevel(response.data.data.serviceLevel, 'serviceLevel');
      $scope.serviceLevelArray = level;
      $scope.updateTabScroll();
      if ($scope.selectedServiceLevel == 0) $scope.selectTab($scope.selectedServiceLevel)
    }
    else { 
      $rootScope.settingPageLoaders.serviceLevelSection = false;
      $scope.checkListError = response.message;
    }
  },function(error){
    $rootScope.settingPageLoaders.serviceLevelSection = false;
    $scope.checkListError = error;
  });
  
  $scope.createPoolModel = function(index){
    $scope.poolTypeModel = angular.copy($scope.serviceLevelArray[index].poolType);
    $scope.sortPoolTypes();
    $scope.poolTypeModelDefault = angular.copy($scope.serviceLevelArray[index].poolType);
  }
  $scope.sortPoolTypes = function() {
    if ($scope.poolTypeModel) {
      $scope.poolTypeModel.sort(function(a, b){
        if(a.poolType.toLowerCase() < b.poolType.toLowerCase()) { return -1; }
        if(a.poolType.toLowerCase() > b.poolType.toLowerCase()) { return 1; }
        return 0;
      })
    }
  }
  $scope.openAddServiceLevelPopup = function(index){
    $rootScope.currentProductAccount = "--";
    angular.forEach( $rootScope.incomeAccountDetails.accountsDataForProduct, function(item){   
      // if($rootScope.incomeAccountDetails.currentProductAccount == item.accountId){
      //    $rootScope.currentProductAccount = item.accountName;
      // }
      $rootScope.selectedIncomeAccountId = item.accountId;
      $rootScope.accountsDataForProductAccountName = item.accountName;
    });
    $scope.serviceLevelModel = {
        checkList:[],
        serviceLevel:{
          title:'',
          description :'',
          time_per_visit:'',
          tech_pay_per_visit:'',
          incomeAccountRef: null,
          id:0,
        }, 
    }
    $scope.ProductAccountID = null;
    if(index !== undefined){
      $scope.serviceLevelModel = {
        checkList:angular.copy($scope.serviceLevelArray[index].checkList),
        serviceLevel:angular.copy($scope.serviceLevelArray[index].serviceLevel)        
      }
      angular.forEach( $rootScope.IncomeAccountDetails.accountsDataForProduct, function(item){   
        if($scope.serviceLevelArray[index].serviceLevel.incomeAccountRef == item.accountId){
           $rootScope.currentProductAccount = item.accountName;
           $scope.ProductAccountID = item.accountId;
        }
        $rootScope.selectedIncomeAccountId = item.accountId;
        $rootScope.accountsDataForProductAccountName = item.accountName;
   });
    }
    $scope.index = index;
    ngDialog.open({
      id  : 10,
      template: 'addServiceLevelPopup.html',
      className: 'ngdialog-theme-default v-center',
      overlay: true,
      closeByNavigation: true,
      scope: $scope,
      preCloseCallback: function() {     
          $scope.serviceLevelModel = {};    
          $scope.index = '';
      }
  });   
  }

  $scope.openChemicalReadingPopup = function() {
      ngDialog.open({
        id  : 10,
        template: 'openChemicalReadingPopup.html',
        className: 'ngdialog-theme-default v-center openChemicalReadingPopup-area',
        closeByNavigation: false,
        closeByDocument: false,
        scope: $scope,
        preCloseCallback: function() {     
            $scope.serviceLevelModel = {};    
            $scope.index = '';
        }
    }); 
    window.addEventListener('click', function(e){  
      if(document.getElementById('openChemicalReadingPopup-area')){
        if (document.getElementById('openChemicalReadingPopup-area').contains(e.target)){
          // Clicked in box
        } else{
          // Clicked outside the box
          if(!$scope.isProcessing){
            $scope.closeModal();      
          }
          else{
            setTimeout(function() {
              $scope.closeModal();      
            },3000)
          }
        }
      }
      });
  }

  $scope.closeChemicalReadings = function() {
    if(!$scope.isProcessing){
      $scope.closeModal();      
    }
    else{
      setTimeout(function() {
        $scope.closeModal();      
      },3000)
    }
  }

  $scope.setIncomeAccount = function(ProductAccountID) {
    $scope.ProductAccountID = ProductAccountID;
    angular.forEach( $rootScope.IncomeAccountDetails.accountsDataForProduct, function(item){   
      if($scope.ProductAccountID == item.accountId){
         $rootScope.currentProductAccount = item.accountName;
      }
      $rootScope.selectedIncomeAccountId = item.accountId;
      $rootScope.accountsDataForProductAccountName = item.accountName;
    });
  }

  $scope.timeError = false;
  $scope.addNewServiceLevel = function(model){   
    model.serviceLevel.incomeAccountRef = $scope.ProductAccountID ? $scope.ProductAccountID : null;
    model.serviceLevel.isChargeTax = model.serviceLevel.isChargeTax ? model.serviceLevel.isChargeTax : 0;
    var postData = model; 
    $rootScope.settingPageLoaders.serviceLevelSection = true;    
    apiGateWay.send('/company/manage_service_level', postData).then(function(response) {
      if(response.data.status == 200){
        var responseData = response.data;
        if($scope.serviceLevelArray[$scope.index]){
          if($scope.serviceLevelArray[$scope.index].serviceLevel.id){
            $scope.serviceLevelArray[$scope.index].serviceLevel.title = model.serviceLevel.title;
            $scope.serviceLevelArray[$scope.index].serviceLevel.description = model.serviceLevel.description;           
            $scope.serviceLevelArray[$scope.index].serviceLevel.time_per_visit = model.serviceLevel.time_per_visit;
            $scope.serviceLevelArray[$scope.index].serviceLevel.tech_pay_per_visit = model.serviceLevel.tech_pay_per_visit;
            $scope.serviceLevelArray[$scope.index].serviceLevel.incomeAccountRef = model.serviceLevel.incomeAccountRef;
            $scope.serviceLevelArray[$scope.index].serviceLevel.isChargeTax = model.serviceLevel.isChargeTax;
            $scope.updateTabScroll(); 
            $rootScope.getServiceLevelTabName()
            $timeout(function() {              
              angular.element('#sChemReadingSeTab0') && angular.element('#sChemReadingSeTab0').triggerHandler('click');
            });
            if($rootScope.getCompanyBillingSettings) {  $rootScope.getCompanyBillingSettings(); }        
          }
        }
        else {
          model.serviceLevel = responseData.data['serviceLevel'];
          var data = responseData.data
          if (data && data.serviceLevel && (data.serviceLevel.isDefault === null || data.serviceLevel.isDefault === undefined)) { data.serviceLevel.isDefault = 0 }
          if (data && data.serviceLevel && (data.serviceLevel.isSystem === null || data.serviceLevel.isSystem === undefined))   { data.serviceLevel.isSystem = 0 }
          $scope.serviceLevelArray.push(data); 
          $scope.createChecklistSection($scope.serviceLevelArray)
          $scope.selectedServiceLevel = $scope.serviceLevelArray.length-1;             
          $scope.updateTabScroll(); 
          $scope.updateCheckListItemHeight()
          $rootScope.getServiceLevelTabName()
          $timeout(function() {              
            angular.element('#sChemReadingSeTab0') && angular.element('#sChemReadingSeTab0').triggerHandler('click');
          });
          if($rootScope.getCompanyBillingSettings) {  $rootScope.getCompanyBillingSettings(); }   
          setTimeout(function(){
            $scope.createPoolModel($scope.serviceLevelArray.length-1);
          }, 500)
          $scope.currentFilterPoolType = 1;
        }     
        $rootScope.settingPageLoaders.serviceLevelSection = false; 
        $scope.closeModal();
        //$scope.addServiceSuccess = response.data.message;   
        $rootScope.getTechRole()           
      } else {   
        $rootScope.settingPageLoaders.serviceLevelSection = false;      
        $scope.addServiceError = response.data.message;
        setTimeout(function(){
          $scope.addServiceSuccess = '';
          $scope.addServiceError = '';
          
          $scope.closeModal();
        }, 100)
      }         
      
      $scope.isProcessing = false;
      $rootScope.settingPageLoaders.serviceLevelSection = false;      
    }, function(error){
      $rootScope.settingPageLoaders.serviceLevelSection = false;
      $scope.addServiceError = error;
        $scope.isProcessing = false;
        setTimeout(function(){
          $scope.addServiceError = '';
          
        }, 2000)
    })
  }
 
  $scope.scrollServiceLevelTab = function (direction){
    var speed=25,distance=100,step=10;
    var element = document.querySelectorAll('.service-tab')[0];
    scrollAmount = 0;
    var slideTimer = setInterval(function(){
        if(direction == 'left'){
            element.scrollLeft -= step;
        } else {
            element.scrollLeft += step;
        }
        scrollAmount += step;
        if(scrollAmount >= distance){
            window.clearInterval(slideTimer);
        }
    }, speed);
  }
  var tabUpdateIntervalIns = '';  
  $scope.updateTabScroll = function(){
    $scope.updateCheckListItemHeight()
    tabUpdateIntervalIns = setTimeout(function(){ 
      $scope.tabContainerWidth = 0;
      var ele = document.querySelectorAll('#serviceTab2')[0];
      for (var i = 0; i < angular.element(ele).children().length; i++) {
        $scope.tabContainerWidth += angular.element(ele).children()[i].clientWidth;
      }
      $scope.tabContainerWidth += 1;   
      if(window.innerWidth > 1920) {
        $scope.tabContainerWidth += 7;   
      }
      $scope.$apply();
      $scope.updateCheckListItemHeight()
    }, 100)     
  }  
  $scope.$watch('chemicalReadingServiceArray', function (newVal, oldVal) {    
    if(newVal){
      $scope.updateTabScroll();
    }            
  }, true);
  $scope.$watch('serviceLevelArray', function (newVal, oldVal) {    
    $scope.updateTabScroll();
  }, true);
  $scope.clearTabUpdateInterval = function(){
    if(tabUpdateIntervalIns){clearTimeout(tabUpdateIntervalIns);}
  }

  $scope.serviceLevelDeleteConfirm = function(id){   
    $scope.serviceLevelId = id;
    $scope.deletePopup = ngDialog.open({
        template: 'removeServiceLevelConfirm.html',
        className: 'ngdialog-theme-default',
        scope: $scope,
        preCloseCallback: function () {
          $scope.serviceLevelId = '';       
        }
    });
  }
  $scope.confirmServiceLevelAction = function(){
    $rootScope.settingPageLoaders.serviceLevelSection = true;    
    apiGateWay.send("/company/delete_service_level", {id: $scope.serviceLevelId, from: 'setting'}).then(function(response) {
        if (response.data.status == 200) {           
            $scope.serviceLevelArray.splice($scope.index, 1);
            apiGateWay.get("/get_service_level").then(function(response) {
              if(response.status == 200) {
                $rootScope.settingPageLoaders.serviceLevelSection = false;
                level = $rootScope.sortServiceLevel(response.data.data.serviceLevel, 'serviceLevel');
                $scope.serviceLevelArray = level;
                $scope.updateTabScroll();
                if ($scope.selectedServiceLevel == 0) $scope.selectTab($scope.selectedServiceLevel)
              }
              else { 
                $rootScope.settingPageLoaders.serviceLevelSection = false;
                $scope.checkListError = response.message;
              }
            },function(error){
              $rootScope.settingPageLoaders.serviceLevelSection = false;
              $scope.checkListError = error;
            });
            $rootScope.getServiceLevelTabName()            
            $timeout(function() {              
              angular.element('#sChemReadingSeTab0') && angular.element('#sChemReadingSeTab0').triggerHandler('click');
            });
            //sChemReadingSeTab
            if($rootScope.getCompanyBillingSettings) {  $rootScope.getCompanyBillingSettings(); }   
            $scope.updateTabScroll();
            $scope.updateCheckListItemHeight()
            $scope.selectedServiceLevel = 0;
            $rootScope.getTechRole()
            
        }
        $scope.closeModal();
        $rootScope.settingPageLoaders.serviceLevelSection = false;
    }, function(error){
      $rootScope.settingPageLoaders.serviceLevelSection = false;

    })
  }
  $scope.selectTab = function(tabIndex, force = false){
    $scope.updateTabScroll();
    $scope.updateCheckListItemHeight();
    serviceLevelId = $scope.serviceLevelArray[tabIndex].serviceLevel.id;
    if(!$scope.serviceLevelArray[tabIndex].checkList || force){
      $rootScope.settingPageLoaders.serviceLevelSection = true;
      apiGateWay.get("/get_service_level_data",{serviceLevelId:serviceLevelId}).then(function(response) {
        if(response.status == 200) {
            $rootScope.settingPageLoaders.serviceLevelSection = false;
            $scope.serviceLevelArray[tabIndex] = response.data.data.serviceLevel[0];
            $scope.createChecklistSection($scope.serviceLevelArray);
            $scope.serviceLevelArrayCache = $scope.serviceLevelArray;
            $scope.poolTypeError = [];
            $scope.createPoolModel(tabIndex);
            $scope.currentFilterPoolType = 1;
          }
        },function(errorResponse){
          $scope.isProcessing = true;
        });
      }
    $scope.createChecklistSection($scope.serviceLevelArray);
    $scope.createPoolModel(tabIndex);
    $scope.selectedServiceLevel = tabIndex;
  }
  /*SERVICE LEVEL UPDATE END*/
  /*Create Checklist*/
  $scope.createChecklistSection = function(serviceLevelArray){
    var checklistBundle = [
        {type:'whenArriving', title:'When Arriving', sectionId:2, data:[]},
        {type:'jobInProgress', title:'Job In Progress', sectionId:1, data:[]},
        {type:'whenLeaving', title:'When Leaving', sectionId:3, data:[]}
    ];
    angular.forEach(serviceLevelArray, function(data, parentIndex){    
      $scope.serviceLevelArray[parentIndex].checklistBundle = angular.copy(checklistBundle);
      angular.forEach(data.checkList, function(item, index){
        item.edit = 0;
        item.editSetting = 0;
        item.sectionId == 1 ? $scope.serviceLevelArray[parentIndex].checklistBundle[1].data.push(item) : ''; 
        item.sectionId == 2 ? $scope.serviceLevelArray[parentIndex].checklistBundle[0].data.push(item) : ''; 
        item.sectionId == 3 ? $scope.serviceLevelArray[parentIndex].checklistBundle[2].data.push(item) : '';
      })      
    });
  }

  $scope.intervalIns = '';
  $scope.saveCheckListTrigger = function(type, parentIndex, index, timeOut=0){
    if(type){
      $scope.serviceLevelArray[$scope.selectedServiceLevel].checklistBundle[parentIndex].data[index].edit = 1;
    }
      $scope.clearSaveInterval(); 
      $scope.intervalIns = $timeout(function() {document.getElementById('checklistSubmitt').click();}, timeOut)
  }
  
  $scope.clearSaveInterval = function(){
      if ($scope.intervalIns) {
          $timeout.cancel($scope.intervalIns)
      }
  }
  $scope.saveFrequencyTrigger = function(){
      $scope.frequencyPopupActive = true;
      $timeout(function() {
        document.getElementById('checklistSubmitt').click();
      }, 100)

  }

  $scope.addNewChecklist = function(index, workFlowType='', title=''){
    $scope.checkListError = '';
    $scope.checkListSuccess = '';
    var bundleList = angular.copy($scope.serviceLevelArray[index].checklistBundle[1].data);
    
    for(var i = 0; i < bundleList.length; i++){
      
      if(bundleList[i] && bundleList[i].randomId && bundleList[i].randomId.includes('random_')){
        $scope.checkListError = 'Unsaved checklist item found';
        break;          
      }else if(i == (bundleList.length - 1)){      
        var newRowChecklist = {
          "workFlowType": workFlowType,
          "status": 1,
          "addressId":0,
          "isLocal": 0,
          "title": title,
          "ordering": 0,
          "photo": 0,
          "deleteAfter": 0,
          "endDate":null,
          "required": 0,
          "createTime": "",
          "frequency": 0,
          "companyId": $scope.companyId,
          "isSystem": 0,
          "edit":1,
          "id": 0,
          "sectionId": 1,
          "randomId": 'random_'+Math.floor(Math.random() * 9999999)+$scope.companyId+Math.floor(Date.now() / 1000)
        }
        if (workFlowType != 'dropDownMenu') {         
          $scope.serviceLevelArray[index].checklistBundle[1].data.unshift(newRowChecklist);
          setTimeout(function(){
            var _t = document.querySelectorAll('.setting-page-chklist-wrap:not(.ng-hide) ul[data-section-id="1"] .setting-checklist-textarea-li:nth-child(1) textarea')[0]
            _t.focus();
            // document.getElementsByClassName('pb-checklist-box')[0].scrollTo(500, 0);
          }, 100)
        }
      }
    
    }
  }

  $scope.checklistDeleteConfirm = function(checkListObj, serviceLevelIndex, parentIndex, index, type){
    if(checkListObj && checkListObj.id==0){
      $scope.serviceLevelArray[serviceLevelIndex].checklistBundle[parentIndex].data.splice(index, 1);
      return
    }
    $scope.checkListObj = checkListObj;
    $scope.serviceLevelIndex = serviceLevelIndex;
    $scope.parentIndex = parentIndex;
    $scope.index = index;
    $scope.type = type;
    ngDialog.open({
        template: 'removeChelistConfirm.html',
        className: 'ngdialog-theme-default',
        scope: $scope,
        preCloseCallback: function () {
          $scope.checkListObj = '';
          $scope.index = '';
          $scope.parentIndex  = '';
          $scope.type = '';
          $scope.serviceLevelIndex = '';
        }
    });
  }
  $scope.confirmChecklistAction = function(checkListObj, serviceLevelIndex, parentIndex, index, type){
    $scope.checklistDeleteErrorMsg = false;
    if(checkListObj.id){
      $scope.isProcessing = false;
      $rootScope.settingPageLoaders.serviceLevelSection = true;      
      ngDialog.closeAll();
      apiGateWay.send("/company/delete_checklist", {id: checkListObj.id, addressId: $scope.addressId}).then(function(response) {
          if (response.data.status == 200) {
            var checkBundleId = $scope.serviceLevelArray[serviceLevelIndex].checklistBundle[parentIndex].data[index].id;
            var checklistCopy = angular.copy($scope.serviceLevelArray[serviceLevelIndex].checkList);

            angular.forEach(checklistCopy, function(val, idx){
              if(val.id == checkBundleId){
                $scope.serviceLevelArray[serviceLevelIndex].checkList.splice(idx, 1);
              }
            });
            $scope.serviceLevelArray[serviceLevelIndex].checklistBundle[parentIndex].data.splice(index, 1);
            // $scope.serviceLevelArray[serviceLevelIndex].checkList = $scope.serviceLevelArray[serviceLevelIndex].checklistBundle[parentIndex].data;
          }
          $rootScope.settingPageLoaders.serviceLevelSection = false;
      }, function(error){
        $rootScope.settingPageLoaders.serviceLevelSection = false;
      });
    }
    else {
      $scope.checklistDeleteErrorMsg = "Invalid action for this checklist item.";
      setTimeout(function(){
        $scope.checklistDeleteErrorMsg = false;
    }, 2000)
    }
  }
   /*dragging*/
   $scope.checklistSortableOptions = {
    accept: function(sourceNodeScope, destNodesScope, destIndex) {   
        var source = sourceNodeScope.$element.attr('data-type');            
        var dest = destNodesScope.$element.attr('data-type');
        if (source == 'checkList-item' && dest == 'checkList'){               
            return true;
        }else{
            return false;
        }        
    },

    dropped: function(event) {  
        $scope.updateCheckListItemHeight()            
        var dragType = event.source.nodeScope.$element.attr('data-type');
        var sourceServiceLevelIndex =  event.source.nodeScope.$element.attr('data-serviceLevel-parent-index');
        var sourceParentIndex =  event.source.nodeScope.$element.attr('data-parent-index');
        var sourceIndex =  event.source.index;
        var destIndex =  event.dest.index;
        var sourceSectionId = event.source.nodeScope.$element.attr('data-section-id');
        var destSectionId = event.dest.nodesScope.$element.attr('data-section-id');              
        var apiGap = 1500;            
        if(dragType == 'checkList-item' && (sourceSectionId != destSectionId || sourceIndex != destIndex)  ){//drag address           
          $scope.sourceServiceLevelIndex = sourceServiceLevelIndex;
          $scope.isCheckItemDropped = true;
          $scope.saveCheckListItem('', '', true);
        }
        setTimeout(function(){
          $scope.updateCheckListItemHeight()
        }, 5)
    },
    beforeDrop: function(event) {
        var dragType = event.source.nodeScope.$element.attr('data-type');
        var sourceServiceLevelIndex =  event.source.nodeScope.$element.attr('data-serviceLevel-parent-index');
        var sourceParentIndex =  event.source.nodeScope.$element.attr('data-parent-index');
        var sourceIndex =  event.source.index;
        var sourceSectionId = event.source.nodeScope.$element.attr('data-section-id');
        var destSectionId = event.dest.nodesScope.$element.attr('data-section-id');
        var destSectionId = event.dest.nodesScope.$element.attr('data-section-id');
        var  isSystem = event.source.nodeScope.$modelValue.isSystem;
        if (isSystem && sourceSectionId != destSectionId){
            return false;
        }
        if(dragType == 'checkList-item' && sourceSectionId != destSectionId){//drag address
            $scope.serviceLevelArray[sourceServiceLevelIndex].checklistBundle[sourceParentIndex].data[sourceIndex].sectionId =  destSectionId;
        }
        return true;
    },

    dragStart : function(event) {
       /* $scope.setBoxStatusPopup = {};
        var body = document.getElementsByTagName('body')[0]
        body.style.overflow = 'hidden';
        body.style.height = '100%';
        */
    },
  }

  //  save checkList Item
  var lastAPIHit = true;
  $scope.saveCheckListItem = function (item, name, isReorder = false, index = 0) {
    $scope.checkListError = '';
    $scope.checkListSuccess = '';
    var isProcessingServiceLevel = true;
    var postDataNew = {};
    if (!isReorder) {
      postDataNew.postData = {
      id: item.id
    };
    if (item && item.workFlowType) {
      postDataNew.postData.workFlowType = item.workFlowType
    }
    if (name == 'increment' && item.workFlowType == "dropDownMenu") {
      postDataNew.postData.options = item.options
      postDataNew.postData['title'] = item.title;
    } else {
      postDataNew.postData[name] = item[name];
    }
    postDataNew.updateAction = name;
    }
    var _selectedIndex = $scope.selectedServiceLevel;
    if ($scope.isCheckItemDropped) {
      _selectedIndex = $scope.sourceServiceLevelIndex;
      $scope.isCheckItemDropped = false;
    }
    $scope.successMsg = false;
    $scope.frequencySuccessMsg = false;
    $scope.clearSaveInterval();
    var date = $scope.frequencyModel.endDate
      ? angular.copy(new Date($scope.frequencyModel.endDate + " 12:00:00"))
      : "";
    if ($scope.frequencyPopupActive) {
      $scope.serviceLevelArray[_selectedIndex].checklistBundle[
        $scope.parentIndex
      ].data[$scope.index].editSetting = 1;
      $scope.serviceLevelArray[_selectedIndex].checklistBundle[
        $scope.parentIndex
      ].data[$scope.index].frequency =
        $scope.frequencyModel.frequencyType == 1
          ? 0
          : $scope.frequencyModel.frequency;
      $scope.tempFrequency =
        $scope.frequencyModel.frequencyType == 1
          ? ""
          : $scope.frequencyModel.frequency;
      $scope.serviceLevelArray[_selectedIndex].checklistBundle[
        $scope.parentIndex
      ].data[$scope.index].deleteAfter =
        $scope.frequencyModel.endDate &&
        $scope.frequencyModel.deleteAfterType == 3
          ? 0
          : $scope.frequencyModel.deleteAfter &&
            $scope.frequencyModel.deleteAfterType == 2
          ? $scope.frequencyModel.deleteAfter
          : 0;
      $scope.tempDeleteAfter =
        $scope.frequencyModel.endDate &&
        $scope.frequencyModel.deleteAfterType == 3
          ? ""
          : $scope.frequencyModel.deleteAfter &&
            $scope.frequencyModel.deleteAfterType == 2
          ? $scope.frequencyModel.deleteAfter
          : "";
      $scope.serviceLevelArray[_selectedIndex].checklistBundle[
        $scope.parentIndex
      ].data[$scope.index].endDate =
        $scope.frequencyModel.deleteAfterType == 3
          ? moment.utc(date).format("YYYY-MM-DD hh:mm:ss")
          : null;
      if (
        !$scope.frequencyModel.endDate &&
        !$scope.frequencyModel.deleteAfter &&
        $scope.frequencyModel.deleteAfterType == 2
      ) {
        return false;
      }
      if (
        !$scope.frequencyModel.frequency &&
        $scope.frequencyModel.frequencyType == 2
      ) {
        return false;
      }
    }
    var postDataList = [];
    postDataList = angular
      .copy(postDataList)
      .concat($scope.serviceLevelArray[_selectedIndex].checklistBundle[1].data);
    postDataList = angular
      .copy(postDataList)
      .concat($scope.serviceLevelArray[_selectedIndex].checklistBundle[0].data);
    postDataList = angular
      .copy(postDataList)
      .concat($scope.serviceLevelArray[_selectedIndex].checklistBundle[2].data);
    var postData = {};
    postData.postData = angular.copy(postDataList);
    var endpoint = "/company/service_level";
    postData.serviceLevel = angular.copy(
      $scope.serviceLevelArray[_selectedIndex].serviceLevel
    );
    postData.serviceLevel.time_per_visit = $scope.serviceLevelArray[
      _selectedIndex
    ].serviceLevel.time_per_visit
      ? $scope.serviceLevelArray[_selectedIndex].serviceLevel.time_per_visit
      : "";
    postData.serviceLevel.tech_pay_per_visit = $scope.serviceLevelArray[
      _selectedIndex
    ].serviceLevel.tech_pay_per_visit
      ? $scope.serviceLevelArray[_selectedIndex].serviceLevel.tech_pay_per_visit
      : "";
    var titleisDefined = true;
    angular.forEach(postData.postData, function (element, index) {
      if (element.title === undefined || element.title === '') {
        titleisDefined = false;
      }
    });
    if ($scope.isCheckItemDropped) {
      $scope.isCheckItemDropped = false;
    }
    if (titleisDefined && isProcessingServiceLevel) {
      angular.forEach(postData.postData, function (element, index) {
        if ((element.id == 0 && element.required) || element.photo) {
          isProcessingServiceLevel = false;
        }
      });
      // re-ordered custom data
      var reOrderedData = [];
      if (isReorder) {
        angular.forEach(postData.postData, function (element, index) {
          reOrderedData.push({
            id: element.id,
            ordering: index + 1,
            sectionId: Number(element.sectionId),
          });
        });
        postDataNew.postData = reOrderedData;
        postDataNew.updateAction = "ordering";
      }

      if (postData.postData[0].randomId !== undefined) {
        postDataNew.postData.randomId = postData.postData[0].randomId;
        postDataNew.updateAction = "increment";
      }
      if (postDataNew.postData.workFlowType != "dropDownMenu" && !postDataNew.postData.id && postDataNew.updateAction == "title") {
        $scope.checkListError = "Invalid action for this checklist item.";
        setTimeout(function () {
          $scope.checkListError = "";
        }, 500);
        return;
      }
      postDataNew.serviceLevelId = postData.serviceLevel.id;
      if (name === "isDefault") {
        postDataNew.postData = postData.postData;
        postDataNew.serviceLevelIsDefault = postData.serviceLevel.isDefault;
      }
      $rootScope.settingPageLoaders.serviceLevelSection = true;
      var postItemId = postDataNew.postData && postDataNew.postData.id ? postDataNew.postData.id : 0;
        if(lastAPIHit){
          lastAPIHit = false;
          apiGateWay.send(endpoint, postDataNew).then(
            function (response) {
              if ($scope.isChangingDefaultServiceLevel) {
                $rootScope.defaultServiceLevelDataFetched = false;
                $rootScope.getDefaultServiceLevelData();
                $scope.isChangingDefaultServiceLevel = false;
                $timeout(function () {
                  $scope.updateSLAdress();
                }, 200);
              }
              isProcessingServiceLevel = true;
              lastAPIHit = true;
              var responseData = response.data;
              var bundleListIndex = 1;
              if (Object.keys(responseData.data).length > 0) {
                angular.forEach($scope.serviceLevelArray[_selectedIndex].checklistBundle,function (bundle, parentIndex) {
                    angular.forEach($scope.serviceLevelArray[_selectedIndex].checklistBundle[parentIndex].data, function (element, index) {
                        $scope.serviceLevelArray[_selectedIndex].checklistBundle[parentIndex].data[index].edit = 0;
                        if(element && element.id && element.id == postItemId){
                          bundleListIndex = parentIndex;
                        }
                        
                        if (element && element.randomId && responseData.data[element.randomId]) {
                          $scope.serviceLevelArray[_selectedIndex].checklistBundle[parentIndex].data[index].id = responseData.data[element.randomId];
                          // delete $scope.serviceLevelArray[_selectedIndex].checklistBundle[parentIndex].data[index].randomId
                        }
                      }
                    );
                  }
                );
              } else {
                angular.forEach($scope.serviceLevelArray[_selectedIndex].checklistBundle, function (bundle, parentIndex) {
                    angular.forEach($scope.serviceLevelArray[_selectedIndex].checklistBundle[parentIndex].data, function (element, index) {
                        $scope.serviceLevelArray[_selectedIndex].checklistBundle[parentIndex].data[index].edit = 0;
                        if(element && element.id && element.id == postItemId){
                          bundleListIndex = parentIndex;
                        }
                      }
                    );
                  }
                );
              }
              if ($scope.frequencyPopupActive) {
                $scope.serviceLevelArray[_selectedIndex].checklistBundle[
                  $scope.parentIndex
                ].data[$scope.index].editSetting = 0;
                $scope.frequencySuccessMsg = "Frequency saved successfully.";
              } else {
                if (response.data.message == "This checklist item name already exists") {
                  if ($scope.dropDownMenuSettingsPopup) {
                    $scope.dropDownMenuError = response.data.message;
                    $rootScope.settingPageLoaders.serviceLevelSection = false;
                    $timeout(function(){
                      $scope.dropDownMenuError = '';
                    }, 2000);
                  }
                  if ($scope.serviceLevelArray[_selectedIndex].checklistBundle[1].data[0].randomId !== undefined) {
                    $rootScope.settingPageLoaders.serviceLevelSection = true;
                    $scope.createChecklistSection($scope.serviceLevelArray);
                    $scope.isProcessing = false;
                    $rootScope.settingPageLoaders.serviceLevelSection = false;
                  } else if (responseData.data.title !== undefined || responseData.data.title !== '') {
                    $scope.serviceLevelArray[_selectedIndex].checklistBundle[bundleListIndex].data[$scope.index].title = responseData.data.title;
                  }
                }
                if (response.data.message == "Checklist saved successfully.") {
                  if ($scope.dropDownMenuSettingsPopup) {
                    $scope.selectTab($scope.selectedServiceLevel, true);
                    $scope.updateTabScroll();
                    setTimeout(function(){
                      $scope.updateCheckListItemHeight()
                    }, 1000)
                    $scope.dropDownMenuSettingsPopup.close();
                  }
                  $scope.checkListSuccess = "Saved";
                  setTimeout(function () {
                    $scope.checkListSuccess = "";
                    $scope.checkListError = "";
                  }, 500);
                  $rootScope.settingPageLoaders.serviceLevelSection = false;
                  if (postDataNew.postData.randomId !== undefined) {
                    delete $scope.serviceLevelArray[_selectedIndex].checklistBundle[1].data[0].randomId;
                    //Add new obj in local list
                    $scope.serviceLevelArray[_selectedIndex].checklistBundle[1].data[0].id = responseData.data.updateData ? responseData.data.updateData.checkListId : Math.floor(Math.random() * 9999999)+$scope.companyId+Math.floor(Date.now() / 1000);
                    // $scope.serviceLevelArray[_selectedIndex].checklistBundle[1].data[0].randomId = responseData.data.updateData ? responseData.data.updateData.checkListId : Math.floor(Math.random() * 9999999)+$scope.companyId+Math.floor(Date.now() / 1000);
                    $scope.serviceLevelArray[_selectedIndex].checkList.unshift($scope.serviceLevelArray[_selectedIndex].checklistBundle[1].data[0]);                
                    
                    $rootScope.settingPageLoaders.serviceLevelSection = false;
                    $scope.isProcessing = false;
                    if (!$scope.$$phase) $scope.$apply()
                  }
                  if (isReorder) {
                    $scope.serviceLevelArray[_selectedIndex].checkList = postDataList;
                  }
                  $scope.serviceLevelArray[_selectedIndex].checklistBundle[bundleListIndex].data[$scope.index][postDataNew.updateAction] = postDataNew.postData[postDataNew.updateAction];
                  if (postDataNew.updateAction === "deleteAfter") {
                    $scope.serviceLevelArray[_selectedIndex].checklistBundle[1].data[$scope.index].endDate = null;
                  } else if(postDataNew.updateAction === "endDate") {
                    $scope.serviceLevelArray[_selectedIndex].checklistBundle[1].data[$scope.index].deleteAfter = 0;
                  }
                } else {
                  $scope.checkListError = response.data.message;
                  $rootScope.settingPageLoaders.serviceLevelSection = false;
                }
              }
              $scope.updateCheckListItemHeight();
              setTimeout(function () {
                if (!$scope.isPopupOpen) {
                  $scope.index = "";
                  $scope.parentIndex = "";
                }
                $scope.frequencyPopupActive = false;
                $scope.frequencySuccessMsg = false;
              }, 2000);
              $rootScope.settingPageLoaders.serviceLevelSection = false;
            },
            function (error) {
              $rootScope.settingPageLoaders.serviceLevelSection = false;
              if (error != "Something went wrong. Please try again.") {
                $scope.checkListError = error;
              }
              $scope.checkListError = error;
              if ($scope.dropDownMenuSettingsPopup) {
                $scope.dropDownMenuError = error;
                $timeout(function(){
                  $scope.dropDownMenuError = '';
                }, 2000);
              }
              setTimeout(function () {
                $scope.checkListError = "";
              }, 2000);
              $rootScope.settingPageLoaders.serviceLevelSection = false;
            }
          );
        }
      }
  };

  $scope.openFrequencyOptionPopup = function(checkListObj, parentIndex, index, type){
    $scope.singlePopup = true;
    $scope.checkListObj = checkListObj;
    $scope.index = index;
    $scope.parentIndex = parentIndex;
    $scope.type = type;
    $scope.isPopupOpen = true;
    $scope.frequencySuccessMsg = false;
    $scope.tempFrequency = checkListObj.frequency ? checkListObj.frequency : '';
    $scope.tempDeleteAfter = checkListObj.deleteAfter ? checkListObj.deleteAfter : '';
    $scope.frequencyModel = {
        frequencyType:checkListObj.frequency ? 2 : 1,
        deleteAfterType:checkListObj.endDate ? 3 : (checkListObj.deleteAfter ? 2 : 1),
        frequency:checkListObj.frequency ? checkListObj.frequency : null,
        deleteAfter:checkListObj.deleteAfter ? checkListObj.deleteAfter : null,
        endDate:checkListObj.endDate
    }

    ngDialog.open({
        id  : 10,
        template: 'setFrequencyPopup.html',
        className: 'ngdialog-theme-default v-center',
        overlay: true,
        name :'setFrequencyPopup',
        closeByNavigation: true,
        scope: $scope,
        preCloseCallback: function() {
            $scope.checkListObj = {};
            $scope.type = '';
            $scope.isPopupOpen = false;
        }
    });

  }

  $rootScope.$on('ngDialog.opened', function (e, $dialog) {

      if($dialog.name == 'setFrequencyPopup' && $scope.singlePopup){
          $scope.singlePopup = false;
          $('.datepicker-custom-input').datepicker({
              startDate: new Date(),
              autoclose: true,
              todayBtn: "linked",
              format: 'mm/dd/yyyy',
              autoclose: true,
          });
          $scope.initialUpdateDate = true
          if($scope.frequencyModel.endDate){
              $scope.initialUpdateDate = false
              $('.datepicker-custom-input').datepicker('update', new Date(moment($scope.frequencyModel.endDate)));
          }
      }
    });
  $scope.chooseDate = function(value){
      $scope.frequencyModel.deleteAfterType = '3';
      if($scope.initialUpdateDate){
          $scope.frequencyModel.deleteAfter = null;
          // $scope.saveFrequencyTrigger();
          $scope.checkListObj.endDate = value;
          $scope.saveCheckListItem($scope.checkListObj, "endDate", false);
      } else {
          $scope.initialUpdateDate = true;
      }
  }

  $scope.setFrequency = function(){
      if($scope.frequencyModel.frequencyType == 1){
          $scope.frequencyModel.frequency = null;
          // $scope.saveFrequencyTrigger();
          $scope.checkListObj.frequency = 0;
          $scope.saveCheckListItem($scope.checkListObj, "frequency", false);
      } else {
          $window.document.getElementById('frequency').focus();
      }

  }


  $scope.setDeleteAfter = function(){

      if(['1','3'].indexOf($scope.frequencyModel.deleteAfterType) > -1){
          $scope.frequencyModel.deleteAfter = null;
          // $scope.saveFrequencyTrigger();
          $scope.checkListObj.deleteAfter = 0;
          $scope.frequencyModel.endDate = null;
          $scope.saveCheckListItem($scope.checkListObj, "deleteAfter", false);
      }
      if(['2'].indexOf($scope.frequencyModel.deleteAfterType) > -1){
          $window.document.getElementById('deleteAfter').focus();
          $scope.frequencyModel.endDate = null;
      }

  }

  $scope.checkFrequencyInput = function (frequency) {
    if (frequency > 1) {
      if (frequency != $scope.tempFrequency) {
        $scope.tempFrequency = angular.copy(frequency);
        // $scope.saveFrequencyTrigger();
        $scope.checkListObj.frequency = frequency
        $scope.saveCheckListItem($scope.checkListObj, "frequency", false);
      }
    } else {
      $scope.tempFrequency = "";
      $scope.frequencyModel.frequency = "";
      // $scope.saveFrequencyTrigger();
      $scope.saveCheckListItem($scope.checkListObj, "frequency", false);
    }
  };

  $scope.checkDeleteAfterInput = function(deleteAfter){
    if(deleteAfter != $scope.tempDeleteAfter){
      $scope.tempDeleteAfter = angular.copy(deleteAfter);
      // $scope.saveFrequencyTrigger();
      $scope.checkListObj.deleteAfter = deleteAfter;
      $scope.checkListObj.endDate = null;
      $scope.saveCheckListItem($scope.checkListObj, "deleteAfter", false);
    }
  }

  $scope.$watch('frequencyModel.frequency', function (newVal, oldVal) {
      if(newVal && newVal > 0){
          $scope.frequencyModel.frequencyType = '2';
      } else {
          $scope.frequencyModel.frequency= '';
          $scope.frequencyModel.frequencyType = '1';
      }
  }, true);

  $scope.$watch('frequencyModel.deleteAfter', function (newVal, oldVal) {

      if(newVal && newVal > 0){
          $scope.frequencyModel.deleteAfterType = '2';
          $scope.frequencyModel.endDate = null;
      } else {
        $scope.frequencyModel.deleteAfter = '';
        if($scope.frequencyModel.deleteAfterType != '3'){
          $scope.frequencyModel.deleteAfterType = '1';
        }


      }

  }, true);
  $scope.saveJobSteps = function(index){
    postData = {
      "beforePicture":$scope.serviceLevelArray[index].serviceLevel.beforePicture ? 1 : 0,
      "psiGaugePicture":$scope.serviceLevelArray[index].serviceLevel.psiGaugePicture ? 1 : 0,
      "psiGaugeReading":$scope.serviceLevelArray[index].serviceLevel.psiGaugeReading ? 1 : 0,
      "afterPicture":$scope.serviceLevelArray[index].serviceLevel.afterPicture ? 1 : 0,
      "addressId":0,
      "serviceLevelId":$scope.serviceLevelArray[index].serviceLevel.id
    }
    apiGateWay.send('/company/set_job_steps',postData).then(function(response) {
        $scope.checkListSuccess = response.data.message;
        setTimeout(function(){
            $scope.checkListSuccess = false;
        }, 2000)
        $scope.isProcessing = false;
    }, function(error){
        $scope.isProcessing = false;
    })
  }
  /*System Checklist Setting*/
  /*Backwash*/
  //backwashData Variable
  $scope.backwashList = {};
  $scope.showBackwash = false;
  $scope.backwashData = {
      instructionsBeforePopup:false,
      instructionsAfterPopup:false,
      instructionsBefore:false,
      instructionsAfter:false
  }
  $scope.Backwash = true;
  $scope.closeBackwashValve = true;
  $scope.showAllInstStartData=false;
  $scope.showAllInstEndData=false;
  $scope.lastBackWashedDate = [];
  //cleanFilteredData Variable
  $scope.cleanFilteredData = {
      instructionsBeforePopup:false,
      instructionsAfterPopup:false,
      instructionsBefore:false,
      instructionsAfter:false,
      beforePicture:true,
      afterPicture:true
  }
  //cleanSaltCellData Variable
  $scope.cleanSaltCellData = {
      instructionsBeforePopup:false,
      instructionsAfterPopup:false,
      instructionsBefore:false,
      instructionsAfter:false,
      beforePicture:true,
      afterPicture:true
  }


  $scope.model = {
    backwashData:{
        valveClosed: 1,
        instStart: 0,
        instEnd: 0,
        instStartData: "",
        backwash: 1,
        backwashId: null,
        instEndData: "",
        required:1
    },
    cleanFilteredData:{
        beforePicture: 1,
        instStart: 0,
        instEnd: 0,
        instStartData: "",
        afterPicture: 1,
        cleanedFilterId: null,
        instEndData: "",
        required:1
    },
    cleanSaltCellData:{
        beforePicture: 1,
        instStart: 0,
        instEnd: 0,
        instStartData: "",
        afterPicture: 1,
        CleanedSaltId: null,
        instEndData: "",
        required:1
    }
  };
  $scope.getCompanySystemChecklistSetting = function(id, type){

    apiGateWay.get("/company_system_checklist", {serviceLevelId:id }).then(function(response) {
        if (response.data.status == 200) {

            var responseData = response.data.data
            if(responseData && Object.keys(responseData).length > 0){
              $scope.model = angular.copy(responseData);
              //backwashList
              $scope.systemChecklistSettingData = response.data.data;
                  if($scope.systemChecklistSettingData.backwashData){
                      $scope.backwashData.instructionsBefore = $scope.systemChecklistSettingData.backwashData.instStart ? true : false;
                      $scope.backwashData.instructionsAfter = $scope.systemChecklistSettingData.backwashData.instEnd ? true : false;
                      $scope.Backwash = $scope.systemChecklistSettingData.backwashData.backwash ? true : false;
                      $scope.closeBackwashValve = $scope.systemChecklistSettingData.backwashData.valveClosed ? true : false;
                      $scope.model.backwashData.required = $scope.systemChecklistSettingData.backwashData.visits ? '3' :
                          ($scope.systemChecklistSettingData.backwashData.required ? '2' : '1')
                              $scope.model.backwashData.visits = !$scope.systemChecklistSettingData.backwashData.visits ? null : $scope.systemChecklistSettingData.backwashData.visits;
                  }
              //End

              //cleanFilteredList
                  if($scope.systemChecklistSettingData.cleanFilteredData){
                      $scope.model.cleanFilteredData = $scope.systemChecklistSettingData.cleanFilteredData;

                      $scope.cleanFilteredData.instructionsBefore = $scope.systemChecklistSettingData.cleanFilteredData.instStart ? true : false;
                      $scope.cleanFilteredData.instructionsAfter = $scope.systemChecklistSettingData.cleanFilteredData.instEnd ? true : false;
                      $scope.cleanFilteredData.beforePicture = $scope.systemChecklistSettingData.cleanFilteredData.beforePicture ? true : false;
                      $scope.cleanFilteredData.afterPicture = $scope.systemChecklistSettingData.cleanFilteredData.afterPicture ? true : false;

                      $scope.model.cleanFilteredData.required = $scope.systemChecklistSettingData.cleanFilteredData.weeks ? '3' :
                          ($scope.systemChecklistSettingData.cleanFilteredData.required ? '2' : '1')
                          $scope.model.cleanFilteredData.weeks = !$scope.systemChecklistSettingData.cleanFilteredData.weeks ? null : $scope.systemChecklistSettingData.cleanFilteredData.weeks;
                  }
              //End


              //cleanSaltCellList
                  if($scope.systemChecklistSettingData.cleanSaltCellData){
                      $scope.model.cleanSaltCellData = $scope.systemChecklistSettingData.cleanSaltCellData;

                      $scope.cleanSaltCellData.instructionsBefore = $scope.systemChecklistSettingData.cleanSaltCellData.instStart ? true : false;
                      $scope.cleanSaltCellData.instructionsAfter = $scope.systemChecklistSettingData.cleanSaltCellData.instEnd ? true : false;
                      $scope.cleanSaltCellData.beforePicture = $scope.systemChecklistSettingData.cleanSaltCellData.beforePicture ? true : false;
                      $scope.cleanSaltCellData.afterPicture = $scope.systemChecklistSettingData.cleanSaltCellData.afterPicture ? true : false;

                      $scope.model.cleanSaltCellData.required = $scope.systemChecklistSettingData.cleanSaltCellData.weeks ? '3' :
                          ($scope.systemChecklistSettingData.cleanSaltCellData.required ? '2' : '1')
                          $scope.model.cleanSaltCellData.weeks = !$scope.systemChecklistSettingData.cleanSaltCellData.weeks ? null : $scope.systemChecklistSettingData.cleanSaltCellData.weeks;

                  }
            }
            var popupName = ''
            if(type == 'Backwash'){
              popupName = 'backwashData';
            } else if(type == 'Cleaned Filter'){
              popupName = 'cleanFilteredData';
            } else {
              popupName = 'cleanSaltCellData';
            }
            ngDialog.open({
              id  : 10,
              template: popupName+'SettingPopup.html',
              className: 'ngdialog-theme-default v-center',
              overlay: true,
              name :'settingPopup',
              closeByNavigation: true,
              scope: $scope,
              preCloseCallback: function() {
              }
            });
        }

    }, function(error) {

    });
  }

  $scope.hideInstructionPopup = function(type, value){
    if(value == 'instructionsBefore' && !$scope.model[type].instStartData){
        $scope[type][value] = false;
        $scope.model[type].instStart = 0;
    }
    if(value == 'instructionsAfter' && !$scope.model[type].instEndData){
        $scope[type][value] = false;
        $scope.model[type].instEnd = 0;
    }
    $scope[type][value+'Popup'] = false;
  }
  $scope.toggleIcons = function(type, value){
    if(value == 'instructionsBefore'){
      if($scope[type][value] == true && $scope.model[type].instStartData){
        $scope[type][value+'Popup'] = true;
        $scope[type][value] = true;
        $scope.model[type].instStart = 1;
      } else {
        $scope[type][value+'Popup'] = !$scope[type][value];
        $scope[type][value] = !$scope[type][value];
        $scope.model[type].instStart = $scope[type][value] ? 1 : 0;

      }
    }
    if(value == 'instructionsAfter'){
      if($scope[type][value] == true && $scope.model[type].instEndData){
        $scope[type][value+'Popup'] =true;
        $scope[type][value] = true;
        $scope.model[type].instEnd = 1;
      } else {
        $scope[type][value+'Popup'] = !$scope[type][value];
        $scope[type][value] = !$scope[type][value];
        $scope.model[type].instEnd = $scope[type][value] ? 1 : 0;
      }
    }
    if(value == 'Backwash'){
      $scope[value] = !$scope[value];
      $scope.model.backwashData.backwash = $scope[value] ? 1 : 0;
      $scope.saveDetails(type, value);
    }
    if(value == 'closeBackwashValve'){
      $scope[value] = !$scope[value];
      $scope.model.backwashData.valveClosed = $scope[value] ? 1 : 0;
      $scope.saveDetails(type, value);
    }
    if(value == 'beforePicture' || value == 'afterPicture'){
      $scope[type][value] = !$scope[type][value];
      $scope.model[type][value] = $scope[type][value] ? 1 : 0;
      $scope.saveDetails(type, value);
    }
  }

  /*Backwash methods Start*/
  $scope.saveDetails = function(type, value){

      var postData = angular.copy($scope.model);
      if(type == 'backwashData' && $scope.model[type].visits == 1){
        $scope.model[type].visits = '';
        postData[type].visits = 0;
      }
      postData.backwashData.required = $scope.model.backwashData.required == 2 ? 1 : 0;
      postData.cleanFilteredData.required = $scope.model.cleanFilteredData.required == 2 ? 1 : 0;
      postData.cleanSaltCellData.required = $scope.model.cleanSaltCellData.required == 2 ? 1 : 0;
      if($scope.model[type] && $scope.model[type].instStart == 0){
          postData[type].instStartData = '';
      }
      if($scope.model[type] && $scope.model[type].instEnd == 0){
          postData[type].instEndData = '';
      }
      if($scope.model[type] && !$scope.model[type].instStartData){
          postData[type].instStart = 0;
      }
      if($scope.model[type] && !$scope.model[type].instEndData){
          postData[type].instEnd = 0;
      }

      if($scope.model[type].required == 1 || $scope.model[type].required == 2){
          if(type == 'backwashData'){
              $scope.model[type].visits = null
              postData[type].visits = 0;
          }
          if(type == 'cleanFilteredData' || type == 'cleanSaltCellData'){
              $scope.model[type].weeks = null
              postData[type].weeks = 0;
          }

      } else if(($scope.model[type].required == 3 && $scope.model[type].visits) || ($scope.model[type].required == 3 && $scope.model[type].weeks)) {
          postData[type].required = 1
      } else {
          postData[type].required = 0
      }
      postData[type].edit = 1;
      postData.backwashData.serviceLevelId = $scope.serviceLevelArray[$scope.selectedServiceLevel].serviceLevel.id;
      postData.cleanFilteredData.serviceLevelId = $scope.serviceLevelArray[$scope.selectedServiceLevel].serviceLevel.id;
      postData.cleanSaltCellData.serviceLevelId = $scope.serviceLevelArray[$scope.selectedServiceLevel].serviceLevel.id;

      apiGateWay.send('/company_system_checklist', {postData:postData}).then(function(response) {
          if (response.data.status == 200) {
              $scope.frequencySuccessMsg = response.data.message;
              $scope.model.backwashData.backwashId = response.data.data.backwashId
              $scope.model.cleanFilteredData.cleanedFilterId = response.data.data.cleanedFilterId
              $scope.model.cleanSaltCellData.CleanedSaltId = response.data.data.CleanedSaltId
              $scope.model.backwashData.edit = 0;
              $scope.model.cleanFilteredData.edit = 0;
              $scope.model.cleanSaltCellData.edit = 0;
              if(type && value){
                  $scope.hideInstructionPopup(type, value);
              }
          } else {
              $scope.frequencySuccessMsg = '';
              $scope.errorMsg = response.data.message;
          }
          setTimeout(function() {
              $scope.errorMsg = '';
              $scope.crossClicked = false;
              $scope.frequencySuccessMsg = '';
              //$scope.isProcessing = false;
              //ngDialog.closeAll();
              if (!$scope.$$phase) $scope.$apply()

          }, 2000);
      }, function(error) {
          var msg = 'Error';
          if (typeof error == 'object' && error.data && error.data.message) {
              msg = error.data.message;
          } else {
              msg = error;
          }
          $scope.frequencySuccessMsg = '';
          $scope.errorMsg = msg;
          $scope.isProcessing = false;
          setTimeout(function() {
              $scope.errorMsg = '';
              $scope.isProcessing = false;
              if (!$scope.$$phase) $scope.$apply()
          }, 2000);
      });
  }
  $scope.setRequired = function(type){
      if(['1','2'].indexOf($scope.model[type].required) > -1){
          if(type == 'backwashData'){
              $scope.model[type].visits = null;
          } else {
              $scope.model[type].weeks = null;
          }

          $scope.saveDetails(type)
      }
      if(['3'].indexOf($scope.model[type].required) > -1){
          $window.document.getElementById(type+'Weeks').focus();
      }
      //if($scope.model[type].required)
  }
  $scope.$watch('model.backwashData.visits', function (newVal, oldVal) {
      if($scope.model.backwashData){
          if(newVal && newVal > 0){
              $scope.model.backwashData.required = '3';
          } else {
              if($scope.model.backwashData.required == '3' ){
                  $scope.model.backwashData.required = '1';
              }
              $scope.model.backwashData.visits= null;
              //$scope.model.backwashData.required = '1';
          }
      }
  }, true);


  $scope.$watch('model.cleanFilteredData.weeks', function (newVal, oldVal) {
      if($scope.model.cleanFilteredData){
          if(newVal && newVal > 0){
              $scope.model.cleanFilteredData.required = '3';
          } else {
              if($scope.model.cleanFilteredData.required == '3' ){
                  $scope.model.cleanFilteredData.required = '1';
              }
              $scope.model.cleanFilteredData.weeks= null;
              //$scope.model.cleanFilteredData.required = '1';
          }
      }
  }, true);

  $scope.$watch('model.cleanSaltCellData.weeks', function (newVal, oldVal) {
      if($scope.model.cleanSaltCellData){
          if(newVal && newVal > 0){
              $scope.model.cleanSaltCellData.required = '3';
          } else {
              if($scope.model.cleanSaltCellData.required == '3' ){
                  $scope.model.cleanSaltCellData.required = '1';
              }
              $scope.model.cleanSaltCellData.weeks= null;
              //$scope.model.cleanSaltCellData.required = '1';
          }
      }

  }, true);

  $scope.openSystemSettingPopup = function(type){
    $scope.getCompanySystemChecklistSetting($scope.serviceLevelArray[$scope.selectedServiceLevel].serviceLevel.id, type);

  }


  $scope.poolTypeError = [];
  $scope.filterPoolType = function(value){
    $scope.poolTypeModel = $scope.poolTypeModel.filter(function (el) {
      return el.id != ''
    });
    $scope.poolTypeError = [];
    $scope.currentFilterPoolType = value;
  }
  $scope.addPoolTypeRow = function(){
    if (!$scope.poolTypeHasNoError()) {
      return
    } else {
      let row = {
        "id":"",
        "poolType":"",
        "serviceLevelId":$scope.serviceLevelArray[$scope.selectedServiceLevel].serviceLevel.id,
        "status":1
      }
      $scope.poolTypeModel.unshift(angular.copy(row));
      $scope.poolTypeModelDefault.unshift(angular.copy(row));
      setTimeout(function(){
        $scope.sortPoolTypes();
      },100)
      //$scope.poolTypeModel['_'+$scope.serviceLevelArray[$scope.selectedServiceLevel].serviceLevel.id].push(row);
    }
  }
  $scope.pooltypeprocessing = false;
  $scope.addPoolType = function(index, type=''){
    if(!type){
      // if(($scope.poolTypeModelDefault[index] && $scope.poolTypeModelDefault[index].poolType ==  $scope.poolTypeModel[index].poolType)  || !$scope.poolTypeModel[index].poolType) { return false}
    }
    $scope.poolTypeError = {}
    if ($scope.index) {
    $scope.poolTypeError[$scope.index] = '';
    }
    let postData = $scope.poolTypeModel[index];
    postData.serviceLevelId = $scope.serviceLevelArray[$scope.selectedServiceLevel].serviceLevel.id
    $scope.pooltypeprocessing = true;
    apiGateWay.send('/pool_type', postData).then(function(response) {
      if (response.data.status == 201) {
        if(!$scope.poolTypeModel[index].id){
          $scope.poolTypeModel[index].id = angular.copy(response.data.data.id);
        }
        $scope.serviceLevelArray[$scope.selectedServiceLevel].poolType = angular.copy($scope.poolTypeModel);
        $scope.poolTypeModelDefault   = angular.copy($scope.poolTypeModel);
        $scope.checkListSuccess = response.data.message;
        $scope.clearSaveInterval();
        $scope.intervalIns = $timeout(function() { $scope.checkListSuccess = false;}, 2000);
        $rootScope.getTechRole();
        setTimeout(function(){
          $scope.pooltypeprocessing = false;
          $scope.sortPoolTypes();
        },100)
        if($rootScope.getCompanyBillingSettings) {  $rootScope.getCompanyBillingSettings(); }
      } else {
        if (postData.id != '') {
          var oldData = $scope.serviceLevelArrayCache[$scope.selectedServiceLevel].poolType.find(x => x.id === postData.id);
          $scope.poolTypeModel[index].poolType = oldData && oldData.poolType ? oldData.poolType : '';
          setTimeout(function(){
            $scope.poolTypeError = []
            $(document).trigger('click');
          }, 2500)
        }
        $scope.pooltypeprocessing = false;
      }
    }, function(error) {
      if (postData.id != '') {
        var oldData = $scope.serviceLevelArrayCache[$scope.selectedServiceLevel].poolType.find(x => x.id === postData.id);
        $scope.poolTypeModel[index].poolType = oldData && oldData.poolType ? oldData.poolType : '';
        setTimeout(function(){
          $scope.poolTypeError = []
          $(document).trigger('click');
        }, 2500)
        }
        $scope.pooltypeprocessing = false;
        $scope.poolTypeError[index] = error;
    });

  }
  $scope.activateInactive = function(index){
    if($scope.poolTypeModel[index].poolType === undefined || $scope.poolTypeModel[index].poolType === null || $scope.poolTypeModel[index].poolType.trim === '') {
      return
    }
    if($scope.poolTypeModel[index].status){
      $scope.poolTypeModel[index].status = 0
    } else {
      $scope.poolTypeModel[index].status = 1
    }
    $scope.addPoolType(index, 'statusChange')

  }
  $scope.poolTypeDeleteConfirm = function(index){
    $scope.poolTypeError = {}
    if(!$scope.poolTypeModel[index].id){
      $scope.poolTypeModel.splice(index, 1);
      setTimeout(function(){
        $scope.sortPoolTypes();
      },100)
      return;
    }
    $scope.index = index;
    ngDialog.open({
        template: 'removePoolTypeConfirm.html',
        className: 'ngdialog-theme-default v-center',
        overlay: true,
        closeByNavigation: true,
        scope: $scope,
        preCloseCallback: function () {
          $scope.index = '';
        }
    });
  }
  $scope.confirmPoolTypeAction = function(){
    $scope.poolTypeError = {}
    if ($scope.index) {
    $scope.poolTypeError[$scope.index] = '';
    }
    apiGateWay.send('/delete_pool_type', {id: $scope.poolTypeModel[$scope.index].id}).then(function(response) {
      if (response.data.status == 200) {
        $scope.poolTypeModel.splice($scope.index, 1);
        $scope.poolTypeModelDefault.splice($scope.index, 1);
        $rootScope.getTechRole();
        if($rootScope.getCompanyBillingSettings) {  $rootScope.getCompanyBillingSettings(); }
      } else {
        if ($scope.index) {
        $scope.poolTypeError[$scope.index] = response.data.message;
        }
      }
      ngDialog.closeAll()
    }, function(error) {
      if ($scope.index) {
      $scope.poolTypeError[$scope.index] = error;
      }
    });
    $scope.serviceLevelArray[$scope.selectedServiceLevel].poolType = $scope.poolTypeModel;
    setTimeout(function(){
      $scope.sortPoolTypes();
    },100)
  }
  $scope.poolTypeHasNoError = function() {
    //  $scope.currentFilterPoolType !=0 &&
    return !$scope.pooltypeprocessing && Object.keys($scope.poolTypeError).length === 0
  }
  // $scope.isDuplicate = (arr) => {
  //   var valueArr = [];
  //   arr.forEach(function(v){
  //     if (v.title) {
  //       valueArr.push(v.title)
  //     }
  //   });
  //   const findDuplicates = (arr) => {
  //     let sorted_arr = arr.slice().sort();
  //     let results = [];
  //     for (let i = 0; i < sorted_arr.length - 1; i++) {
  //       if (sorted_arr[i + 1] == sorted_arr[i]) {
  //         results.push(sorted_arr[i]);
  //       }
  //     }
  //     return results;
  //   }
  //   var isDuplicate = valueArr.some(function(item, idx){
  //       return valueArr.indexOf(item) != idx
  //   });
  //   return isDuplicate
  // }
  $scope.updateCheckListItemHeight = (e) => {
    $(function() {
        $('.checklist-item-input').each(function() {
            $(this).height(0)
            var newHeight = $(this).prop('scrollHeight');
            if (newHeight < 42) {
              newHeight = 35
            }
            $(this).height(newHeight-10);
        });
    });
  }
  $scope.isChangingDefaultServiceLevel = false;
  $scope.toggleDefaultServiceLevel = (serviceLevelArray, serviceLevelObj, isDefault) => {
    if (isDefault == 1) {
      $scope.showDefautlSLToggleAlert();
      return
    }
    if (serviceLevelArray && serviceLevelArray.length > 0) {
      serviceLevelArray.forEach(function(_serviceLevelObj){
        _serviceLevelObj.serviceLevel.isDefault = 0
      })
    }
    serviceLevelObj.serviceLevel.isDefault = isDefault == 1 ? 0 : 1;
    $scope.isChangingDefaultServiceLevel = true;
    // $scope.saveCheckList()
    $scope.saveCheckListItem(serviceLevelObj, "isDefault", false);
  }

  $scope.showDefautlSLToggleAlert = () => {
    $scope.defautlSLToggleAlert = ngDialog.open({
      template: 'defautlSLToggleAlert.html',
      className: 'ngdialog-theme-default',
      scope: $scope,
      preCloseCallback: function () {
      }
  });
  }      
  document.addEventListener("scroll", function(){    
    $scope.updateTabScroll(); 
  })
  $scope.updateSLAdress = () => {
    apiGateWay.get('/update_sl_address')
  }
  // Multiple checklist
  $scope.addNewChecklistAction = function(index, workFlowType='', data=null) {
    if (workFlowType == 'dropDownMenu') {
      $scope.checkListError = '';
      $scope.checkListSuccess = '';
      var bundleList = angular.copy($scope.serviceLevelArray[index].checklistBundle[1].data);
      for(var i = 0; i < bundleList.length; i++){
        if(bundleList[i] && bundleList[i].randomId && bundleList[i].randomId.includes('random_')){
          $scope.checkListError = 'Unsaved checklist item found';
          break;          
        } else if(i == (bundleList.length - 1)){
          $scope.addDropDownChecklist(index, workFlowType, data);
        }
      }
    } else {
      $scope.addNewChecklist(index, workFlowType);
    }
  }
  $scope.dropDownMenuSettingsPopup = null;
  $scope.addDropDownChecklistModel = {
    workFlowType: 'dropDownMenu',
    index: null,
    title: '',
    options: [{ title: '' }],
    mode: ''
  };
  $scope.addItem = function () {
    $scope.dropDownMenuError = '';
    if ($scope.hasBlankOptions()) {
      $scope.dropDownMenuError = "Please fill all existing options before adding a new one.";
      $timeout(function(){
        $scope.dropDownMenuError = '';
      }, 2000)
      return;
    }
    $scope.addDropDownChecklistModel.options.push({ title: '' });
  };
  $scope.removeItem = function (index) {
    $scope.addDropDownChecklistModel.options.splice(index, 1);    
  };
  $scope.hasBlankOptions = function() {
    return Array.isArray($scope.addDropDownChecklistModel.options) && $scope.addDropDownChecklistModel.options.some(option => !option.title || option.title.trim() === "");
  };
  $scope.hasDuplicateOptions = function() {
    let titles = $scope.addDropDownChecklistModel.options.map(option => option.title.trim().toLowerCase());
    return new Set(titles).size !== titles.length;
  };
  $scope.dropDownMenuError = '';
  $scope.showDropDownMenuError = function(message) {
    $scope.dropDownMenuError = message;
    $timeout(() => { $scope.dropDownMenuError = ''; }, 2000);
  }
  $scope.saveDropDownSettings = function() {
    $scope.dropDownMenuError = '';
    if (!$scope.addDropDownChecklistModel.title.trim()) {
        let titleInput = document.getElementById('addDropDownChecklistModelTitle');
        if (titleInput) {
          titleInput.classList.add('has-error');
          $timeout(() => { 
            titleInput.classList.remove('has-error');
          }, 2000);
        }
        $scope.showDropDownMenuError("Menu Title is required");
    } else if ($scope.addDropDownChecklistModel.options.length < 1) {
        $scope.showDropDownMenuError("At least one option is required.");
    } else if ($scope.hasBlankOptions()) {
        $scope.showDropDownMenuError("Options cannot be blank.");
    } else if ($scope.hasDuplicateOptions()) {
        $scope.showDropDownMenuError("Duplicate options are not allowed.");
    } else {
      let index = $scope.addDropDownChecklistModel.index;
      let data = {
        "workFlowType": $scope.addDropDownChecklistModel.workFlowType,
        "status": 1,
        "addressId":0,
        "isLocal": 0,
        "title": $scope.addDropDownChecklistModel.title,
        "ordering": 0,
        "photo": 0,
        "deleteAfter": 0,
        "endDate":null,
        "required": 0,
        "createTime": "",
        "frequency": 0,
        "companyId": $scope.companyId,
        "isSystem": 0,
        "edit":1,
        "id": 0,
        "sectionId": 1,
        "randomId": 'random_'+Math.floor(Math.random() * 9999999)+$scope.companyId+Math.floor(Date.now() / 1000),
        "options": $scope.sanitizeOptions($scope.addDropDownChecklistModel.options),
        "serviceLevelId": $scope.serviceLevelArray[$scope.selectedServiceLevel].serviceLevel.id,
      }
      let actionType = 'increment';
      if ($scope.addDropDownChecklistModel.mode == 'edit') {
        data.id = $scope.addDropDownChecklistModel.id;
        actionType = 'title';
      }
      $scope.saveCheckListItem(data, actionType, false, index)
    }    
  }
  $scope.sanitizeOptions = function(data) {
    if (data && data.length > 0) {
      return data.map(item => ({ title: item.title }));
    } else {
      return [];
    }
  }
  $scope.addDropDownChecklist = function(index, workFlowType, data) {
    $scope.addDropDownChecklistModel.index = index;
    $scope.addDropDownChecklistModel.workFlowType = workFlowType;
    if (data) {
      $scope.addDropDownChecklistModel.mode = 'edit';
      $scope.addDropDownChecklistModel.id = data.id;
      $scope.addDropDownChecklistModel.title = data.title;
      $scope.addDropDownChecklistModel.options = data.options || [];
    } else {
      $scope.addDropDownChecklistModel.mode = 'add';
    }
    $timeout(function(){
      $scope.updateOptionsHeight();
    }, 200)
    $scope.dropDownMenuSettingsPopup = ngDialog.open({
      template: 'dropDownMenuSettingsPopup.html',
      className: 'ngdialog-theme-default v-center',
      overlay: true,
      closeByNavigation: false,
      closeByDocument: false,
      closeByEscape: false,
      scope: $scope,
      preCloseCallback: function(type) {  
        $scope.dropDownMenuSettingsPopup = null;
        $scope.addDropDownChecklistModel = {
          type: '',
          index: null,
          title: '',
          options: [{ title: '' }],
          mode: ''
        };
      }
    }) 
  }
  $scope.updateOptionsHeight = (e) => {
    $(function() {
        $('.drop-down-menu-option-input').each(function() {
            $(this).height(0)
            var newHeight = $(this).prop('scrollHeight');
            if (newHeight < 42) {
              newHeight = 35
            }
            $(this).height(newHeight-10);
        });
    });
  }
  $scope.dropDownMenuOptionConfig = {
    accept: function(sourceNodeScope, destNodesScope, destIndex) {   
        var source = sourceNodeScope.$element.attr('data-type');            
        var dest = destNodesScope.$element.attr('data-type');
        console.log(source, dest, destIndex)
        if (source == 'dropdown-option' && dest == 'dropdown-options-area'){               
            return true;
        }else{
            return false;
        }        
    },
    dropped: function(event) {
      console.log(event)
      if (!$scope.$$phase) $scope.$apply()
    }
  }
  $scope.$watch('serviceLevelArray', function (newVal, oldVal) {            
    setTimeout(function(){
        $scope.updateCheckListItemHeight()
    }, 5)
}, true);
  // Multiple checklist
});
