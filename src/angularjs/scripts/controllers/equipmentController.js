angular.module('POOLAGENCY')
.filter('monthName', [function() {
    return function (dateString) { //1 = January
        var dateParts = dateString.split('-');
        var nth = function(d) {
            if (d > 3 && d < 21) return 'th';
            switch (d % 10) {
              case 1:  return "st";
              case 2:  return "nd";
              case 3:  return "rd";
              default: return "th";
            }
          }
        var monthNames = [ 'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December' ];
        return dateParts[0] + nth(dateParts[0]) + ' ' + monthNames[dateParts[1] - 1];
    }
}])
.controller('equipmentController', function($rootScope, $scope, apiGateWay, ngDialog, service, $state, $stateParams,$timeout, $window, auth, configConstant, pendingRequests) {
    var userSession = auth.getSession();
    // WaterGuru variables
    $scope.isPodIdAdding = false;
    $scope.isPodIdRemoving = false;
    $scope.maxEquipmentToShow = 0;
    $scope.getMaxEquipmentSize = function() {
        const w = window.innerWidth;
        let t = 7;
        if (w < 1200 && w > 992) {
            t = 6;
        } else if (w < 992 && w > 768) {
            t = 4;
        } else if (w < 768 && w > 576) {
            t = 3;
        } else if (w < 576) {
            t = 2;
        }
        $scope.maxEquipmentToShow = t;
    }
    $scope.getMaxEquipmentSize();
    window.addEventListener('resize', function(){
        $scope.getMaxEquipmentSize()
    });
    $scope.equipmentExpandible = false;
    $scope.equipmentExpanded = false;
    $scope.toggleEquipmentArea = function() {
        $scope.equipmentExpanded = !$scope.equipmentExpanded;
    }
    $scope.isPodIdInputShowing = false;
    $scope.togglePodInput = function(status) {
        if (status == 'show') {
            $scope.isPodIdInputShowing = true;
        }
        if (status == 'hide') {
            $scope.isPodIdInputShowing = false;
        }
    }
    $scope.savePodId = function(equipmentId, model) {
        let podInput = document.getElementById('podIdInput');
        if (podInput) {
            let podId = podInput.value.trim();
            if (podId) {
                model.savingPodId = true;
                model._podId = podId;
                $scope.saveEquipmentDetail(equipmentId, model)
            }
        }
    }
    $scope.removePodId = function() {
        let equipmentId = $scope.selectedPodIdForRemove.equipmentId;
        let model = $scope.selectedPodIdForRemove.model;
        model.removingPodId = true;
        model._podId = $scope.selectedPodIdForRemove.podId;
        $scope.saveEquipmentDetail(equipmentId, model)             
    }
    $scope.unlinkModal = null;
    $scope.selectedPodIdForRemove = null;
    $scope.openUnlinkModal = function(equipmentId, model, podId) {
        $scope.selectedPodIdForRemove =  {
            equipmentId: equipmentId,
            model: model,
            podId: podId
        };
        $scope.unlinkModal = ngDialog.open({
            template: 'unlinkPodIdConfirm.html',
            className: 'ngdialog-theme-default v-center',
            scope: $scope,    
            preCloseCallback: function() {
                $scope.selectedPodIdForRemove = null;
            }      
        });
    } 
    $scope.getRangeValue = function(value) {
        if (value == 0) {
            return 0;
        } else if (value >= 1 && value <= 25) {
            return 1;
        } else if (value >= 26 && value <= 50) {
            return 2;
        } else if (value >= 51 && value <= 75) {
            return 3;
        } else {
            return 4;
        }
    };
    $scope.getPadBatteryCount = function(count, suffix){
        if (count === null || count === undefined || count === '' || (count && count.trim() === '')) {
            return '<strong>?</strong>';
        } else {
            return count + suffix;
        }
    }
    // WaterGuru variables
    $scope.canEditReadings = userSession.canEditReadings;
    $scope.companyId = userSession.companyId;
    $scope.userId = userSession.userId;
    $scope.addressId = $stateParams.addressId;
    $rootScope.eqTempelateId = null;
    $scope.equipments = [];
    $scope.equipmentsData = [];
    $scope.equipmentsEntry = [];   
    $scope.availableEquipmentID = [];    
    $scope.photos = [];
    //backwashData Variable
    $scope.backwashList = {};
    $scope.showBackwash = false;
    $scope.backwashData = {
        instructionsBeforePopup:false,
        instructionsAfterPopup:false,
        instructionsBefore:false,
        instructionsAfter:false,
        initialWatch:true
    }
    $scope.Backwash = false;
    $scope.closeBackwashValve = false;
    $scope.lastBackWashedDatesPopup = false;
    $scope.lastBackWashedDateTenSeeMore = false;
    $scope.showAllInstStartData=false;
    $scope.showAllInstEndData=false;
    $scope.lastBackWashedDate = [];
    $scope.productBundleListNew = [];
    //cleanFilteredData Variable
    $scope.cleanFilteredList = {};
    $scope.showCleanedFilter = false;
    $scope.cleanFilteredData = {
        instructionsBeforePopup:false,
        instructionsAfterPopup:false,
        instructionsBefore:false,
        instructionsAfter:false,
        beforePicture:false,
        afterPicture:false,
        initialWatch:true
    }       
    $scope.lastFilterCleanedDatesPopup = false;
    $scope.lastFilterCleanedDateTenSeeMore = false;
    $scope.lastFilterCleanedDate = [];


    //cleanSaltCellData Variable
    $scope.cleanSaltCellList = {};
    $scope.showCleanedSaltCell = false;
    $scope.cleanSaltCellData = {
        instructionsBeforePopup:false,
        instructionsAfterPopup:false,
        instructionsBefore:false,
        instructionsAfter:false,
        beforePicture:false,
        afterPicture:false,
        initialWatch:true
    }       
    $scope.saltCleanedHistoryDatesPopup = false;
    $scope.saltCleanedHistoryDateTenSeeMore = false;
    $scope.saltCleanedHistoryDate = [];


    $scope.logBox = {
        status : false,
        type: '',
        model: ''
    }
    $scope.currentUser = auth.getSession();
    $scope.pageObj =  {
        currentPageInv: 1,
        pageInv: '',
        limitInv: 10,
        totalRecordInv: '',
        totalPageInv: ''        
    }
    $scope.dirInv = 'desc';
    $scope.columnInv = 'createTime';
    $scope.discountTypeTemp = "%";

    $scope.templateNameHeading ="";
   
    $scope.waterLevelLowHistoryDate = [];    
    $scope.waterLevelLowHistoryDatesPopup = false;
    $scope.waterLevelLowHistoryDateTenSeeMore = false;
    $scope.imageInitialIndex = 999;
    $scope.crossClicked = false;  
    $scope.isApiProcessing = false;
    $scope.model = {
        backwashData: {},
        cleanFilteredData: {},
        cleanSaltCellData: {}
    }
    $scope.selectedWaterBody={};
    $scope.equipmentsDisplay = false;
    $scope.oneJobModel = {};
    $scope.bundleTotalTemp = "0";
    $scope.taxPercentValueTemp = "";
    $scope.durationOption = {format: 'HH:mm', showClear: false};
    $scope.selectedXeqId = null;
    $scope.gettingDetailsradionchange = true;
    $scope.postDataScheduleJob = null;
    $scope.firstTimeFrequency = null;
    $scope.isCleanSaltCellDataCounterUpdated = false;
    $scope.isCleanFilteredDataCounterUpdated = false;
    $scope.isBackwashDataCounterUpdated = false;
    $scope.cachedBackwashDataVisits = 0;
    $scope.cachedCleanFilteredDataWeeks = 0;
    $scope.cachedCleanSaltCellDataWeeks = 0;
    $scope.updateEditedCounter = (type) => {
        if (type=='cleanSaltCellData') {
            $scope.isCleanSaltCellDataCounterUpdated = true
        }
        if (type=='cleanFilteredData') {
            $scope.isCleanFilteredDataCounterUpdated = true
        }
        if (type=='backwashData') {
            $scope.isBackwashDataCounterUpdated = true
        }
    }
    $scope.apiProcessing = {};
    $scope.hasTrueValue = function() {
        return !$scope.addJobTemplatePopup && Object.values($scope.apiProcessing).includes(true);
    }
    /*get Equipment Details*/
    let endpoint = '/equipments';
    var currEnvironment = configConstant.currEnvironment;
    var apiUrl = configConstant[currEnvironment].server; 
    $rootScope.getEquipmentDetails = function(waterBody) {  
        let canAPIHit;
        var pr = pendingRequests.get();        
        if (pr.length > 0) {
            pr.forEach(function(r){
                if (r.url === apiUrl + endpoint) {                    
                    canAPIHit = false;
                } else {
                    canAPIHit = true;
                }
            })
        } else { 
            canAPIHit = true;                 
        }
        if (canAPIHit) {                       
            $scope.isProcessing = true;
            if(waterBody && waterBody.id){
                $scope.selectedWaterBody = waterBody;
            }
            var pdata = {
                addressId: $scope.addressId,
                waterBodyId:$scope.selectedWaterBody.id,
            }; 
            $scope.apiProcessing.equipments = true;
            apiGateWay.get("/equipments", pdata).then(function(response) {
                $scope.apiProcessing.equipments = false;
                $scope.equipments = [];
                $scope.equipmentsData = [];
                $scope.equipmentsEntry = [];
                $scope.availableEquipmentID = [];
                $scope.backwashData.instructionsBeforePopup = false;
                $scope.backwashData.instructionsAfterPopup = false;
    
                $scope.cleanFilteredData.instructionsBeforePopup = false;
                $scope.cleanFilteredData.instructionsAfterPopup = false;
    
                $scope.cleanSaltCellData.instructionsBeforePopup = false;
                $scope.cleanSaltCellData.instructionsAfterPopup = false;
    
                if (response.data) {
                    if (response.data.status == 200) {
                        $scope.equipmentsData = response.data.data.globalEqList || [];
                        $scope.equipmentExpandible = $scope.equipmentsData.length > $scope.maxEquipmentToShow;
                        angular.forEach($scope.equipmentsData, function(element){
                            $scope.equipmentsDisplay = element.eqId;
                        })
                        $scope.cachedBackwashDataVisits = response.data.data.backwashList.backwashData.visits;
                        $scope.cachedCleanFilteredDataWeeks = response.data.data.cleanFilteredList.cleanFilteredData.weeks;
                        $scope.cachedCleanSaltCellDataWeeks = response.data.data.cleanSaltCellList.cleanSaltCellData.weeks;                        
                        $rootScope.disableBackwashChecklist = false;
                        $rootScope.disableBackwashChecklistText = '';
                        $rootScope.disableFilterCleanedChecklist = false;
                        $rootScope.disableFilterCleanedChecklistText = '';
                        $rootScope.disableSaltCellCleanedChecklist = false; 
                        $rootScope.disableFilterCleanedChecklistText = '';
                        if(response.data.data.addressEqList){
                            $scope.equipmentsEntry = response.data.data.addressEqList;
                            angular.forEach($scope.equipmentsEntry, function(item) {
                                if(item.typeId == 1){ //Filter - Sand
                                    $rootScope.disableFilterCleanedChecklist = true;
                                    $rootScope.disableFilterCleanedChecklistText = 'Not shown in app (Sand Filter)';
                                }                            
                                if(item.typeId == 2){ //Filter - Cartridge
                                    $rootScope.disableBackwashChecklist = true;
                                    $rootScope.disableBackwashChecklistText = 'Not shown in app (Cartridge Filter)';
                                }
                                if(item.typeId == 3){ //Filter - DE
                                    
                                }
                                if(item.typeId == 20){ //Filter - None
                                    $rootScope.disableBackwashChecklist = true;
                                    $rootScope.disableBackwashChecklistText = 'Not shown in app (No Filter)';
                                    $rootScope.disableFilterCleanedChecklist = true;
                                    $rootScope.disableFilterCleanedChecklistText = 'Not shown in app (No Filter)';
                                }
                                if(item.typeId == 21){ //Salt System - None
                                    $rootScope.disableSaltCellCleanedChecklist = true;
                                    $rootScope.disableSaltCellCleanedChecklistText = 'Not shown in app (No Salt System)';
                                } else {
                                    
                                }
                                
                            })
                        }                    
                        angular.forEach($scope.equipmentsData, function(item) {
                            var equipmentAdditionalData = $scope.equipmentsEntry.filter(eitem => eitem.eqId == item.eqId);                       
                            item.detail = equipmentAdditionalData[0] ?  equipmentAdditionalData[0] : {}; 
                            var equipmentSelectedType = item.eqType.filter(eitem => eitem.typeId == item.detail.typeId);                        
                            item.selectedType = equipmentSelectedType[0] ? equipmentSelectedType[0] : ''
                            $scope.equipments.push(item);
                            if ($scope.selectedXeqId) {
                                $scope.selectedEquipment =  $scope.equipments.filter(eitem => eitem.eqId == $scope.selectedXeqId); 
                                if ($scope.selectedEquipment.length > 0) {
                                    $scope.currentEqp = $scope.selectedEquipment[0];
                                }
                            }
                        });
                        for(var i = 0; i < $scope.equipments.length;i++){
                            if($rootScope.isRouteActive == false){
                                if(i == 0 || i == 5){
                                    $scope.equipments[i].isRouteActive = false;
                                }
                                else{
                                    $scope.equipments[i].isRouteActive = true;
                                }
                            }
                            else{
                                $scope.equipments[i].isRouteActive = true;
                            }
                        }
                        setTimeout(function() {
                            $scope.gettingDetailsradionchange = false
                        }, 200)
                        angular.forEach($scope.equipments, function(item) {  
                            //if(item.detail.isPresent == 1 || item.detail.isPresent == undefined){
                                $scope.availableEquipmentID.push(item.eqId);
                            //} 
                        });
                                            
    
                            //Water Level Low history
                            $scope.waterLevelLowHistoryDate = response.data.data.waterLevelLowHistory ? response.data.data.waterLevelLowHistory : [];
                            $scope.waterLevelLowHistoryDateTen = [];
                            if(response.data.data.waterLevelLowHistory && response.data.data.waterLevelLowHistory.length > 0){
                                $scope.waterLevelLowHistoryDateTen = response.data.data.waterLevelLowHistory.filter((item,index)=>{
                                    if(index > 9){return;}
                                    return item;
                                })
                            }
                            if( $scope.waterLevelLowHistoryDate.length > 10){
                                $scope.waterLevelLowHistoryDateTenSeeMore = true;
                            }
    
                        
                        
                        //backwashList
                        $scope.backwashList = response.data.data.backwashList; 
                        $scope.backwashOn = response.data.data.backwashList.backwashOn ? true : false;
                        if($scope.model && $scope.model.backwashData){
                            if($scope.backwashList.backwashData){   
                                $scope.backwashData.initialWatch = true;
                                $scope.model.backwashData = $scope.backwashList.backwashData;
                    
                                $scope.backwashData.instructionsBefore = $scope.backwashList.backwashData.instStart ? true : false;
                                $scope.backwashData.instructionsAfter = $scope.backwashList.backwashData.instEnd ? true : false;
                                $scope.Backwash = $scope.backwashList.backwashData.backwash ? true : false;
                                $scope.closeBackwashValve = $scope.backwashList.backwashData.valveClosed ? true : false;                           
                                $scope.model.backwashData.required = $scope.backwashList.backwashData.visits ? '3' : 
                                    ($scope.backwashList.backwashData.required ? '2' : '1')                                    
                                        $scope.model.backwashData.visits = !$scope.backwashList.backwashData.visits ? null : $scope.backwashList.backwashData.visits;
                            }               
                            if($scope.backwashList.backwashOn){
                                $scope.model.backwashOn = $scope.backwashList.backwashOn;           
                            }       
                        }
                        //backwash history
                        $scope.lastBackWashedDate = response.data.data.backwashList.backwashHistory ? response.data.data.backwashList.backwashHistory : [];
                        $scope.lastBackWashedDateTen = [];
                        if(response.data.data.backwashList.backwashHistory && response.data.data.backwashList.backwashHistory.length > 0){
                            $scope.lastBackWashedDateTen = response.data.data.backwashList.backwashHistory.filter((item,index)=>{
                                if(index > 9){return;}
                                return item;
                            })
                        }
                        if( $scope.lastBackWashedDate.length > 10){
                            $scope.lastBackWashedDateTenSeeMore = true;
                        }
                        //End
    
                        //cleanFilteredList
                        $scope.cleanFilteredList = response.data.data.cleanFilteredList; 
                        if($scope.model && $scope.model.cleanFilteredData){
                            if($scope.cleanFilteredList.cleanFilteredData){  
                                $scope.cleanFilteredData.initialWatch = true;          
                                $scope.model.cleanFilteredData = $scope.cleanFilteredList.cleanFilteredData;
                    
                                $scope.cleanFilteredData.instructionsBefore = $scope.cleanFilteredList.cleanFilteredData.instStart ? true : false;
                                $scope.cleanFilteredData.instructionsAfter = $scope.cleanFilteredList.cleanFilteredData.instEnd ? true : false;
                                $scope.cleanFilteredData.beforePicture = $scope.cleanFilteredList.cleanFilteredData.beforePicture ? true : false;
                                $scope.cleanFilteredData.afterPicture = $scope.cleanFilteredList.cleanFilteredData.afterPicture ? true : false;
                                
                                $scope.model.cleanFilteredData.required = $scope.cleanFilteredList.cleanFilteredData.weeks ? '3' : 
                                    ($scope.cleanFilteredList.cleanFilteredData.required ? '2' : '1')                            
                                    $scope.model.cleanFilteredData.weeks = !$scope.cleanFilteredList.cleanFilteredData.weeks ? null : $scope.cleanFilteredList.cleanFilteredData.weeks;   
                                        
                            }
                        }
                        //Filter Cleaned history
                        $scope.lastFilterCleanedDate = response.data.data.filterCleanedHistory ? response.data.data.filterCleanedHistory : [];
                        $scope.lastFilterCleanedDateTen = [];
                        if(response.data.data.filterCleanedHistory && response.data.data.filterCleanedHistory.length > 0){
                            $scope.lastFilterCleanedDateTen = response.data.data.filterCleanedHistory.filter((item,index)=>{
                                if(index > 9){return;}
                                return item;
                            })
                        }
                        if( $scope.lastFilterCleanedDate.length > 10){
                            $scope.lastFilterCleanedDateTenSeeMore = true;
                        }
                        //End
    
    
                        //cleanSaltCellList
                        $scope.cleanSaltCellList = response.data.data.cleanSaltCellList; 
                        if($scope.model && $scope.model.cleanSaltCellData){
                            if($scope.cleanSaltCellList.cleanSaltCellData){    
                                $scope.cleanSaltCellData.initialWatch = true;        
                                $scope.model.cleanSaltCellData = $scope.cleanSaltCellList.cleanSaltCellData;
                    
                                $scope.cleanSaltCellData.instructionsBefore = $scope.cleanSaltCellList.cleanSaltCellData.instStart ? true : false;
                                $scope.cleanSaltCellData.instructionsAfter = $scope.cleanSaltCellList.cleanSaltCellData.instEnd ? true : false;
                                $scope.cleanSaltCellData.beforePicture = $scope.cleanSaltCellList.cleanSaltCellData.beforePicture ? true : false;
                                $scope.cleanSaltCellData.afterPicture = $scope.cleanSaltCellList.cleanSaltCellData.afterPicture ? true : false;
                                
                                $scope.model.cleanSaltCellData.required = $scope.cleanSaltCellList.cleanSaltCellData.weeks ? '3' : 
                                    ($scope.cleanSaltCellList.cleanSaltCellData.required ? '2' : '1')                            
                                    $scope.model.cleanSaltCellData.weeks = !$scope.cleanSaltCellList.cleanSaltCellData.weeks ? null : $scope.cleanSaltCellList.cleanSaltCellData.weeks;
                                    
                            }                        
                        }
                        //salt cleaned history
                        $scope.saltCleanedHistoryDate = response.data.data.saltCleanedHistory ? response.data.data.saltCleanedHistory : [];
                        $scope.saltCleanedHistoryDateTen = [];
                        if(response.data.data.saltCleanedHistory && response.data.data.saltCleanedHistory.length > 0){
                            $scope.saltCleanedHistoryDateTen = response.data.data.saltCleanedHistory.filter((item,index)=>{
                                if(index > 9){return;}
                                return item;
                            })
                        }
                        if( $scope.saltCleanedHistoryDate.length > 10){
                            $scope.saltCleanedHistoryDateTenSeeMore = true;
                        }
                        //End
    
                    } 
                }
                setTimeout(function() {
                    $scope.isProcessing = false;
                    if (!$scope.$$phase) $scope.$apply()
                }, 1000)                    
            }, function(error) {
                $scope.apiProcessing.equipments = false;
            });                 
        }                  
    };

     
    $scope.onArrowKeyEvent = function() {
        document.onkeydown = function (e) {
            var ele = document.getElementsByClassName("equipment-detail-popup");
            if(!$scope.isProcessing && !$scope.isApiProcessing && ele.length > 0 ){
                if(e.target.nodeName == "TEXTAREA" ) return;                
                var openDialog = ngDialog.getOpenDialogs();
                if(openDialog.length > 1) return;
                switch (e.key) {
                    case 'ArrowUp':
                        // up arrow
                        break;
                    case 'ArrowDown':
                        // down arrow
                        break;
                    case 'ArrowLeft':
                    $timeout(function(){
                        $scope.showEquipmentDetail($scope.equipmentPrev)         
                    }, 100)
                        
                        break;
                    case 'ArrowRight':
                    $timeout(function(){
                        $scope.showEquipmentDetail($scope.equipmentNext)      
                    }, 100)                       
                }
            }
        };
    }
    //Success Error var for below function
    $scope.eqScheduleError = '';
    $scope.eqScheduleMsg = '';
    $scope.currentEqp = {};
    $scope.startDateArr = [];

    $scope.removeStartDates = function(idx){
        $scope.oneJobModel.job.dates.splice(idx,1);
        // $scope.saveFilterLocalTemplate();
    }

    $scope.getOneJobTemplate = function(eqpTempelateId){
        $scope.isProcessing = true; 
        $scope.apiProcessing.one_job_template_v2 = true;
        apiGateWay.get("/one_job_template_v2", {id: eqpTempelateId}).then(function(response) {            
            $scope.apiProcessing.one_job_template_v2 = false;
            if (response.data.status == 200) {  
                let templateData = response.data.data; 
                $scope.eqpTempelateId = eqpTempelateId;
                // $scope.addressId = templateData.addressId;
                $scope.addJob = templateData.addJob

                if($scope.firstTimeFrequency == null){
                    $scope.firstTimeFrequency = templateData.frequency
                }

                if(templateData.endDate){
                    let endDateistence = templateData.endDate;
                    // var endDate = new Date(endDateistence);
                    // var endDateDay = endDate.getDate();
                    // var endDateMonth = endDate.toLocaleString('default', { month: 'long' }); 
                    // $scope.endDateistence = endDateMonth+' '+endDateDay;
                    var dateArr = endDateistence.split('-');
                    var dateArrDate = dateArr[2];
                    var dateArrMonthIndex = Number(dateArr[1]) - 1;
                    var monthNames =  ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                    var dateArrMonth = monthNames[dateArrMonthIndex];
                    $scope.endDateistence = dateArrMonth + ' ' + dateArrDate;
                }
                
                templateData.jobTitle = templateData.templateName;
                templateData.note = templateData.officeNote;
                templateData.eqpTempelateId = eqpTempelateId;
                if(!templateData.dates){
                    templateData.dates = [];
                }
                if(!templateData.endDate){
                    templateData.ends_on = 'never';
                }else{
                    templateData.ends_on = 'specific';
                    templateData.end_date = templateData.endDate;
                }
                if(templateData.duration == "Invalid date" || (templateData.duration && !templateData.duration.includes(':'))){
                    var duration = "2014-02-27T00:00";
                } else {
                    if(templateData.duration){
                        var duration =  "2014-02-27T"+templateData.duration;
                    } else {
                        var duration = "2014-02-27T00:00";
                    }
                }
                
                
                if(templateData.dates.length == 0 && templateData.frequency > 0){
                    templateData.how_often = 'every';
                }else{
                    templateData.how_often = 'specific';
                }                
                $scope.oneJobModel={
                    "job":{                            
                        "duration": duration,
                        "instruction": templateData.instruction,
                        "jobTitle": templateData.title,
                        "note": templateData.officeNote,
                        "templateName": templateData.templateName,
                        "frequency" : templateData.frequency,
                        "dates": templateData.dates,
                        "how_often": templateData.how_often,
                        "ends_on":templateData.ends_on,
                        "jobLastCleanedOn": templateData.jobLastCleanedOn,
                        "jobWillBeCreatedOn": templateData.jobWillBeCreatedOn,
                        "jobWasCreatedOn": templateData.jobWasCreatedOn,
                        "createTime": templateData.createTime,
                        "isDeleted": templateData.isDeleted,
                        "jobId": eqpTempelateId
                    },
                };  
                $scope.getSubtotalForTax();
                $scope.isProcessing = false;                                     
            } else {
                $scope.productNoItem = true;
                $scope.isProcessing = false;            
            }
        }, function(error){
            $scope.apiProcessing.one_job_template_v2 = false;      
        });
    }

    $scope.preFillEqpPopup = function(eqpTempelateId){
        // Enable and get saved local copy
        $rootScope.eqTempelateId = eqpTempelateId;
        $scope.getOneJobTemplate(eqpTempelateId);
        $scope.isApiProcessing = true;
        $scope.apiProcessing.one_job_item = true;
        apiGateWay.get("/one_job_item", {
            jobId:eqpTempelateId,
            isTemplate:1,
        }).then(function(response) {            
            $scope.apiProcessing.one_job_item = false;     
            if (response.data.status == 200) {  
                bundleSubTotalTemp = response.data.data.subTotalAmount;
                if(bundleSubTotalTemp == "null"){
                    $scope.bundleSubTotalTemp = bundleSubTotalTemp;
                } else {
                    $scope.bundleSubTotalTemp = 0;
                }
                $scope.getSubtotalForTax();
                let productBundleListNew = response.data.data.productAndService;
                if(productBundleListNew){
                    $scope.productBundleListNew = productBundleListNew; 
                    $scope.productBundleListNewCategory = response.data.data.productAndService.category; 
                }  
                $scope.isApiProcessing = false; 
                angular.forEach($scope.productBundleListNew, (element, index) => {
                    if (element.bundleItemReference && element.bundleItemReference.length > 0) {
                        angular.forEach(element.bundleItemReference, (element2, index2) => {
                            if(!element2.duration || element2.duration == 'None'){
                                element2.duration = '00:00:00';
                            }
                        });
                    }
                    else{
                        if(!element.duration || element.duration == 'None'){
                            element.duration = '00:00:00';
                        }
                    }
                });
                $scope.payOptionData = response.data.data.payOption;
                  angular.forEach($scope.payOptionData, (element, index) => {
                    $scope.payOption = element.option;
                    $scope.payId = element.id;
                  });
                
                  if(response.data.data.discountTitle){
                    var str = response.data.data.discountTitle;
                    if(str.includes("$") == true){
                        let matches = str.replace("$", "");
                        $scope.discountTypeTemp = '$';
                        $scope.discountTitleTemp = '';
                        $scope.discountValueTemp = matches;
                    } 
                    if(str.includes("%") == true){
                        let matches = str.replace("%", "");
                        $scope.discountValueTemp = matches;
                        $scope.discountTitleTemp = response.data.data.discountTitle;
                    }
                  } else {
                    $scope.discountValueTemp = "0";
                    $scope.discountTitleTemp = "";
                  }

                if(response.data.data.custTaxTitle){
                    $scope.taxTitleTemp = response.data.data.custTaxTitle
                } else {
                    $scope.taxTitleTemp = "";
                }

                $scope.discountCalculationTemp = response.data.data.discountValue;
                $scope.bundleTotalTemp = response.data.data.totalAmount;
                $scope.bundleSubTotalTemp = response.data.data.subTotalAmount;
    
                $scope.taxDataTemp = response.data.data.taxData;
                angular.forEach($scope.taxDataTemp, (element, index) => {
                    $scope.companyId = element.companyId;
                });
                $scope.getDefaultTaxData();
                if(response.data.data.taxValue && response.data.data.taxValue){
                    $scope.taxValueTemp = response.data.data.taxValue;
                } else{
                    $scope.taxValueTemp = "";
                }
                 

                if(response.data.data.custTaxPercentValue){
                    $scope.taxPercentValueTemp = response.data.data.custTaxPercentValue;
                } else{
                    $scope.taxPercentValueTemp = "";
                }
                $scope.getSubtotalForTax();
            } else {
                $scope.productNoItem = true;
                $scope.isApiProcessing = false;               
            }
        }, function(error){
            $scope.apiProcessing.one_job_item = false;
        });

        
        // if ($scope.addJobTemplatePopup) {
        //     $scope.addJobTemplatePopup.close();
        // }
        // $scope.addJobTemplatePopup = ngDialog.open({
        //     template: 'editFilterLocal.html',
        //     className: 'ngdialog-theme-default v-center',
        //     scope: $scope,
        //     closeByEscape: $scope.productEdit,
        //     closeByDocument: true,
        //     preCloseCallback: function() {
        //         $scope.productEdit = false;
        //         $scope.scheduleJob();
        //     }
        // });

        
    }
    
    $scope.addBundleProductSearch = () => {
        $scope.saveOneTimeJobVar = true;
        $scope.bundleSearchForm = true;
        setTimeout(function(){
            angular.element("#bundleSearchTextTemp").focus();
        }, 100);
    }

    $scope.$on('productAddEvent', function(event, data) {
        if (data && data.widgetArea == 'equipmentSection') {    
            if (data.isClose) {
                $scope.bundleSearchForm = false;
                $scope.isBundleSearch = false;               
                return
            }
            let totalCheck = 0;
            if (data.bundleItemReference && data.bundleItemReference.length > 0) {
                let total = 0;
                angular.forEach(data.bundleItemReference, function(item){
                    item.price = (typeof item.price === "number") ? item.price : parseFloat(item.price.replace(/[^0-9.-]/g, ''))
                    total += (item.qty) * (item.price);
                });
                totalCheck = $scope.bundleTotal + total;
            } else {
                totalCheck = $scope.bundleTotal + data.price;
            }
            if (totalCheck < 0) {          
                $scope.errorProductForm = "The products & services total can't be less than $0.00";
                setTimeout(function() {
                    $scope.errorProductForm  = "";
                }, 2000);
            } else {
                $scope.addProductToBundle(data);
                $scope.saveOneTimeJobLocal();
            }
        }
    });
    $scope.addProductToBundle = (productBundleListCategory) => {
        if(productBundleListCategory.bundleItemReference && productBundleListCategory.bundleItemReference.length > 0) {
            angular.forEach(productBundleListCategory.bundleItemReference, (element, index) => {
                //  if isChargeTax is missing from element
                if ((element.isChargeTax === undefined || element.isChargeTax ===  null)) {                
                    apiGateWay.get("/product_services_save", {
                        id: element.id
                    }).then(function(response) {
                        var isChargeTax;
                        //  if isChargeTax is missing from response
                        if(response.data.data.isChargeTax === undefined || response.data.data.isChargeTax === null) {
                            if (element.category == "Product") {
                                if ($scope.defaultTaxSettingData.companyProductTax == 1) {
                                    isChargeTax = 1
                                } else {
                                    isChargeTax = 0
                                }
                            }
                            if (element.category == "Service") {
                                if ($scope.defaultTaxSettingData.companyServiceTax == 1) {
                                    isChargeTax = 1
                                } else {
                                    isChargeTax = 0
                                }
                            }
                        } else {
                            //  if isChargeTax is not missing from response
                            isChargeTax = response.data.data.isChargeTax;
                        }
                        element.isChargeTax = isChargeTax;                    
                    }, function(error){
                    });
                }  
            });
        }
        if($scope.productNoItem == true){
            let bundleObj = [{
                "category":productBundleListCategory.category, 
                "description": productBundleListCategory.description ? productBundleListCategory.description : '',
                "bundleItemReference":productBundleListCategory.bundleItemReference?productBundleListCategory.bundleItemReference:null,
                "cost": productBundleListCategory.cost, 
                "id": productBundleListCategory.id, 
                "name": productBundleListCategory.name, 
                "price": productBundleListCategory.price, 
                "sku": productBundleListCategory.sku, 
                "qty": productBundleListCategory.qty ? productBundleListCategory.qty : 1,
                "isChargeTax": productBundleListCategory.isChargeTax ? productBundleListCategory.isChargeTax : 0,
                "duration": productBundleListCategory.duration ? productBundleListCategory.duration : "00:00:00"
            }];
            $scope.productBundleListNew = bundleObj;
            $scope.productBundleListNewCategory = bundleObj.category;
            $scope.productNoItem = false; 
        } else {
            let bundleObj = {
                "category":productBundleListCategory.category,
                "description": productBundleListCategory.description ? productBundleListCategory.description : '',
                "bundleItemReference":productBundleListCategory.bundleItemReference?productBundleListCategory.bundleItemReference:null, 
                "cost": productBundleListCategory.cost,
                "sku": productBundleListCategory.sku?productBundleListCategory.sku:'', 
                "id": productBundleListCategory.id, 
                "name": productBundleListCategory.name, 
                "price": productBundleListCategory.price, 
                "qty": productBundleListCategory.qty ? productBundleListCategory.qty : 1,
                "isChargeTax": productBundleListCategory.isChargeTax ? productBundleListCategory.isChargeTax : 0,
                "duration": productBundleListCategory.duration ? productBundleListCategory.duration : "00:00:00"
            };
            $scope.productBundleListNew.push(bundleObj);
            $scope.productBundleList = angular.copy($scope.productBundleListNew);
            $scope.calculateBundleDurationTemp($scope.productBundleListNew);
        }
        $scope.isBundleSearch = false;
        $scope.bundleSearchForm = false;
        $scope.bundleCost = productBundleListCategory.cost;
        $scope.calculateBundleCostTemp();    
    }

    function toSeconds(s,q) {
        var p = s.split(':');
        $scope.seconds = (parseInt(p[0], 10) * 3600 + parseInt(p[1], 10) * 60 + parseInt(p[2], 10)+$scope.seconds)*q;
        }
    
        function fill(s, digits) {
        s = s.toString();
        while (s.length < digits) s = '0' + s;
        return s;
        }
    
        $scope.calculateBundleDurationTemp = (productBundleListNew) => { 
            $scope.seconds = 0;
            productBundleListNew.forEach((productBundle) => {
                if(productBundle.category == 'Bundle') {
                    productBundle.bundleItemReference.forEach((bundles) => {
                        if(!bundles.duration || bundles.duration == 'None'){
                            bundles.duration = '00:00:00';
                        }
                        toSeconds(bundles.duration,bundles.qty);
                    });
                }
                else{
                    if(!productBundle.duration || productBundle.duration == 'None'){
                        productBundle.duration = '00:00:00';
                    }
                    toSeconds(productBundle.duration, productBundle.qty);
                }
            });
            $scope.oneJobModel.job.duration = '2020-11-03T'+
            fill(Math.floor($scope.seconds / 3600), 2) + ':' +
            fill(Math.floor($scope.seconds / 60) % 60, 2) + ':' +
            fill($scope.seconds % 60, 2);
        }

    $scope.removeProductToBundle = function(productBundleListNew, index){ 
        if ($scope.productBundleListNew.length > -1){
            let total = (typeof $scope.bundleTotalTemp === "number") ? $scope.bundleTotalTemp : parseFloat($scope.bundleTotalTemp.replace(/[^0-9.-]/g, ''));
            let itemTotal = (typeof $scope.productBundleListNew[index].price === "number") ? $scope.productBundleListNew[index].price : parseFloat($scope.productBundleListNew[index].price.replace(/[^0-9.-]/g, ''));
            itemTotal = itemTotal < 0 ? Math.abs(itemTotal) : itemTotal;
            if ((total - itemTotal) < 0) {
              $scope.errorProductForm = "The products & services total can't be less than $0.00";
              setTimeout(function () {
                $scope.errorProductForm = "";
              }, 2000);
              return false;
            }
            $scope.productBundleListNew.splice( index, 1);
            $scope.calculateBundleDurationTemp($scope.productBundleListNew);
        }    
        if($scope.productBundleListNew.length == 0){
            $scope.bundleTotalTemp = 0;
            $scope.discountCalculation = 0;
            $scope.taxValue = 0;
            $scope.discountValue = 0;
            $scope.discountTitle = "";
            $scope.taxPercentValue = 0;
            $scope.taxTitle = 0;
        }
        $scope.calculateBundleCostTemp();
        $scope.updateDiscountsTemp();
        $scope.updateTaxesTemp();
    }

    $scope.addTaxJobTemp = function(){
        $scope.getSubtotalForTax();
        let taxValue = ($scope.getSubtotalForTax())*$scope.taxPercentValueTemp/100;
        $scope.taxValueTemp = taxValue;
        if($scope.discountValueTemp != ""){
            if($scope.addDiscountTemp){
                $scope.addDiscountTempPopup.close();
            }else{
                ngDialog.close();
            }
            if($scope.discountTypeTemp == '%'){
                $scope.discountCalculationTemp = ($scope.bundleSubTotalTemp*$scope.discountValueTemp)/100;
                let bundleTotalTemp = $scope.bundleSubTotalTemp - $scope.discountCalculationTemp;
                $scope.bundleTotalTemp = bundleTotalTemp + $rootScope.negativeRoundUp($scope.taxValueTemp); 
                $scope.discountTitleTemp = $scope.discountValueTemp+$scope.discountTypeTemp;
            } else {
                let discountCalculationTemp = $scope.bundleSubTotalTemp-$scope.discountValueTemp+$rootScope.negativeRoundUp($scope.taxValueTemp); 
                if(discountCalculationTemp < 0){
                    $scope.errorDiscountTemp = true;
                    setTimeout(function() {
                        $scope.errorDiscountTemp = false;
                    }, 2000); 
                    $scope.discountCalculationTemp = "";
                    $scope.bundleTotalTemp = $scope.bundleSubTotalTemp+$rootScope.negativeRoundUp($scope.taxValueTemp); 
                } else {
                    $scope.errorDiscountTemp = false;
                    $scope.discountCalculationTemp = $scope.discountValueTemp;
                    $scope.bundleTotalTemp = discountCalculationTemp;
                }
                
                
                
            }
                
			
        }
        
    }

    $scope.updateDiscountTypeTemp = function(value){
        $scope.discountTypeTemp = value;
        if($scope.discountTypeTemp == '%'){
            let discountCalculationTemp = ($scope.bundleSubTotalTemp*($scope.discountValueTemp))/100;
            $scope.discountCalculationTemp = discountCalculationTemp;
            bundleTotalTemp = $scope.bundleSubTotalTemp-($scope.discountCalculationTemp)+($rootScope.negativeRoundUp($scope.taxValueTemp)); 
            $scope.bundleTotalTemp = bundleTotalTemp;
        } else {
            if($scope.discountValueTemp){            
                let discountCalculationTemp = $scope.bundleSubTotalTemp-($scope.discountValueTemp+$rootScope.negativeRoundUp($scope.taxValueTemp)); 
                $scope.discountCalculationTemp = $scope.discountValueTemp;
                $scope.bundleTotalTemp = discountCalculationTemp;
            }
        }
        $scope.getSubtotalForTax();
    }

    $scope.removeTaxTemp = function(){
        $scope.taxTitleTemp = "";
        $scope.taxPercentValueTemp  = 0;
        $scope.taxValueTemp = ($scope.getSubtotalForTax()*($scope.taxPercentValueTemp))/100;
        $scope.bundleTotalTemp = $scope.bundleSubTotalTemp-($scope.discountCalculationTemp)+($rootScope.negativeRoundUp($scope.taxValueTemp));
        $scope.getSubtotalForTax();
    }

    $scope.calculateBundleCostTemp = () => {
        if ($scope.productBundleListNew.length > 0 && !$rootScope.negativeCheckPassed($scope.productBundleListNew)) {
            $scope.errorProductForm = "The product & service total can't be less than $0.00";
            setTimeout(function () {
                $scope.errorProductForm = "";
            }, 2000);
            return;
        }
        $scope.bundleSubTotalTemp = 0;
        if( $scope.productBundleListNew.length > 0){
            angular.forEach($scope.productBundleListNew, function(value, key) {
                $scope.productBundleListNew[key].qty = parseFloat(value.qty);
                if((value.category == "Bundle" || value.category == "bundle") && value.bundleItemReference.length > 0){
                    var bundleItemTotal = 0;
                    angular.forEach(value.bundleItemReference, function(v, k) {
                        bundleItemTotal = bundleItemTotal + $rootScope.negativeRoundUp((v.price)*(v.qty));                    
                    });
                    $scope.productBundleListNew[key].price = bundleItemTotal;
                    bundleItemTotal = $rootScope.negativeRoundUp(bundleItemTotal * (value.qty));
                    $scope.bundleSubTotalTemp = $scope.bundleSubTotalTemp + (bundleItemTotal);
                    $scope.bundleTotalTemp = $scope.bundleSubTotalTemp;

                }else{
                    $scope.bundleSubTotalTemp = $scope.bundleSubTotalTemp + ($rootScope.negativeRoundUp((value.price)*(value.qty)));
                    $scope.bundleTotalTemp = $scope.bundleSubTotalTemp;
                }
                
            })
            
        }
        let taxValueTemp = $scope.bundleSubTotalTemp*($scope.taxPercentValueTemp)/100;
        $scope.taxValueTemp = taxValueTemp;

        $scope.updateDiscountsTemp();
        
        if($scope.discountTypeTemp == '%'){            
            $scope.discountCalculationTemp = ($scope.bundleSubTotalTemp*($scope.discountValueTemp))/100;
            let taxValueTemp = ($scope.getSubtotalForTax()) * ($scope.taxPercentValueTemp)/100
            $scope.taxValueTemp = taxValueTemp;
            let bundleTotalTemp = $scope.bundleSubTotalTemp - $scope.discountCalculationTemp;
            $scope.bundleTotalTemp = bundleTotalTemp+$scope.taxValueTemp;
        } else {
            let discountCalculationTemp = $scope.bundleSubTotalTemp-($scope.discountValueTemp+$scope.taxValueTemp); 
            let taxValueTemp = ($scope.getSubtotalForTax()) * ($scope.taxPercentValueTemp)/100
            $scope.taxValueTemp = taxValueTemp;
            $scope.discountCalculationTemp = $scope.discountValueTemp;
            $scope.bundleTotalTemp = discountCalculationTemp;
        }

        if($scope.discountValueTemp){
            $scope.discountTitleTemp = $scope.discountValueTemp+$scope.discountTypeTemp;
        }

        // $scope.getSubtotalForTax();        
        $scope.updateDiscountsTemp();
        $scope.updateTaxesTemp();
        // $scope.saveFilterLocalTemplate();
    }

    $scope.updateTaxesTemp = () => {
        if ($scope.taxPercentValueTemp) {
            $scope.taxValueTemp = ($scope.getSubtotalForTax())*$scope.taxPercentValueTemp/100;
            $scope.bundleTotalTemp = ($scope.bundleSubTotalTemp-$scope.discountCalculationTemp)+$rootScope.negativeRoundUp($scope.taxValueTemp);
        }
    }

    $scope.updateDiscountsTemp = () => {
        if($scope.discountTypeTemp == '%'){        
            $scope.discountCalculationTemp = ($scope.bundleSubTotalTemp*$scope.discountValueTemp)/100;
            let bundleTotalTemp = $scope.bundleSubTotalTemp - ($scope.discountCalculationTemp);
            $scope.bundleTotalTemp = bundleTotalTemp + $rootScope.negativeRoundUp($scope.taxValueTemp); 
        } else {
            let discountCalculationTemp = $scope.bundleSubTotalTemp-$scope.discountValueTemp+$rootScope.negativeRoundUp($scope.taxValueTemp); 
            $scope.discountCalculationTemp = $scope.discountValueTemp;
            $scope.bundleTotalTemp = discountCalculationTemp;        
        }
        if($scope.discountValueTemp){
            $scope.discountTitleTemp = $scope.discountValueTemp+$scope.discountTypeTemp;
        }
    }

    $scope.removeTax = function(){
        $scope.taxTitleTemp = "";
        $scope.taxPercentValueTemp  = 0;
        $scope.taxValueTemp = ($scope.bundleSubTotalTemp*($scope.taxPercentValueTemp))/100;
        $scope.bundleTotalTemp = $scope.bundleSubTotalTemp-($scope.discountCalculationTemp)+($rootScope.negativeRoundUp($scope.taxValueTemp)); 
        $scope.getSubtotalForTax();
    }

    $scope.selectTaxTemp = (companyId) => {
        if (companyId.title && companyId.amount) {
            $scope.taxTitleTemp = companyId.title;
            $scope.taxPercentValueTemp  = companyId.amount;
            $scope.taxValueTemp = ($scope.getSubtotalForTax()*($scope.taxPercentValueTemp))/100;
            $scope.bundleTotalTemp = $scope.bundleSubTotalTemp-($scope.discountCalculationTemp)+($rootScope.negativeRoundUp($scope.taxValueTemp));
            $scope.getSubtotalForTax();
        }
    }

    $scope.removeDiscountTemp = function(){
        $scope.discountValueTemp = "";
        $scope.discountCalculationTemp = ($scope.bundleSubTotalTemp*($scope.discountValueTemp))/100;
        let taxValueTemp = ($scope.getSubtotalForTax() * ($scope.taxPercentValueTemp))/100
        $scope.taxValueTemp = taxValueTemp;
        $scope.bundleTotalTemp = $scope.bundleSubTotalTemp-($scope.discountCalculationTemp)+($rootScope.negativeRoundUp($scope.taxValueTemp)); 
        $scope.discountTitleTemp = "";
        $scope.updateTaxesTemp();
    }

    $scope.addDiscountTemp = function() {        
        $scope.addDiscountTempPopup = ngDialog.open({
            template: 'addDiscountTemp.html',
            className: 'ngdialog-theme-default v-center',
            scope: $scope,
            closeByEscape: false,
            closeByDocument: false,
        });
    };

    $scope.closeTaxJobTemp = function(){
        if($scope.addDiscountTemp){
            $scope.addDiscountTempPopup.close();
        }else{
            ngDialog.close();
        }
        $scope.discountTitleTemp = "";
        $scope.discountValueTemp = 0;
        $scope.discountCalculationTemp = $scope.bundleSubTotalTemp*$scope.discountValueTemp/100;
        $scope.bundleTotalTemp = $scope.bundleSubTotalTemp-$scope.discountCalculationTemp;  
        $scope.getSubtotalForTax(); 
    }

    $scope.showDiscountValueTemp = function(discountValueTemp) {  
        $scope.discountValueTemp = discountValueTemp;
        if($scope.discountValueTemp){
            if($scope.discountTypeTemp == '%'){
                $scope.discountCalculationTemp = ($scope.bundleSubTotalTemp*$scope.discountValueTemp)/100;
                let bundleTotalTemp = $scope.bundleSubTotalTemp - $scope.discountCalculationTemp;
                $scope.bundleTotalTemp = bundleTotalTemp + $scope.taxValueTemp; 
                $scope.discountTitle = $scope.discountValueTemp+$scope.discountType;
            } else {
                let discountCalculationTemp = $scope.bundleSubTotalTemp-$scope.discountValueTemp+$scope.taxValueTemp; 
                $scope.discountCalculationTemp = $scope.discountValueTemp;
                $scope.bundleTotalTemp = discountCalculationTemp;
            }
        }
    }
    $scope.oftenEveryInputClicked = function() {
        // angular.element('#frequency_val').focus();
        $scope.saveFilterLocalTemplate();
    }
    $scope.oftenDateInputClicked = function() {
        // angular.element('#frequency_val').val('');
        if ($scope.oneJobModel.job.dates.length > 0) {
            $scope.saveFilterLocalTemplate();
        } else {
            $timeout(function() {
                angular.element('#add_extra_date').triggerHandler('click');
              });
            
        }
    }
    $scope.$on('ngDialog.opened', function (e, $dialog) {
        $scope.errorProductForm = '';
        $scope.successProductForm = ""
        setTimeout(function(){
            $('.input-daterange').datepicker({ 
                format: 'yyyy-mm-dd'
            });
            $("#add_extra_date").datepicker({
                showOn: 'button',
                buttonText: 'Choose Date',
                dateFormat: 'MM/dd',
                startDate: new Date()
            }).on('changeDate', function (ev) {
                var dateIns = new Date(ev.date);
                var day = (dateIns.getDate()).toString().padStart(2, '0');
                var month = (dateIns.getMonth() + 1).toString().padStart(2, '0');
                var year = dateIns.getFullYear(); 
                var obj = {'date' : day + '-' + month + '-' + year};
                var checkExistence = true;
                if($scope.oneJobModel.job.dates.length > 0) {
                    $scope.oneJobModel.job.dates.forEach(function (item) {
                        if (item.date == (day + '-' + month + '-' + year)) {
                            checkExistence = false;
                            return
                        }
                        else if (item.date == (day + '-' + month + '-' + parseInt(dateIns.getFullYear() + 1))) {
                            checkExistence = false;
                            return;
                        }
                    });
                }                
                if (checkExistence) {
                    $scope.oneJobModel.job.dates.push(obj)
                    $scope.saveFilterLocalTemplate();
                }                
            });

            $("#end_date").datepicker({
                showOn: 'button',
                buttonText: 'Choose Date',
                dateFormat: 'MM/dd',
                startDate: new Date()
            }).on('changeDate', function (ev) {
                $scope.endDate = ev.date;
                var endDate = new Date(ev.date);
                var endDateDay = endDate.getDate();
                var endDateMonth = endDate.toLocaleString('default', { month: 'long' }); 
                $scope.endDateistence = endDateMonth+' '+endDateDay;  
                $scope.saveFilterLocalTemplate();            
            });

            $('#endsOnOnSpecificDates').change(function() {
                $('#end_date').trigger( "click" )
            });
            
        },1000);

    });


    /*$scope.$on('ngDialog.opened', function (e, $dialog) {
        $scope.errorProductForm = '';
        $scope.successProductForm = ""
        setTimeout(function(){
            $('.duration').mask('00:00');
            $('.input-daterange').datepicker({ 
                format: 'yyyy-mm-dd'
            });
            $("#add_extra_date").datepicker({
                showOn: 'button',
                buttonText: 'Choose Date',
                dateFormat: 'MM/dd'
            }).on('changeDate', function (ev) {
                $scope.oneJobModel.job.dates = [];
                var dateIns = new Date(ev.date);
                var day = dateIns.getDate();
                var month = dateIns.getMonth() + 1; 
                var obj = {'date' : day + '-' + month};
                var checkExistence = $scope.oneJobModel.job.dates.filter(function(item){return item.date == (day + '-' + month)});
                if(checkExistence.length == 0){
                    $scope.oneJobModel.job.dates.push(obj)    
                }

    
            });

            $("#end_date").datepicker({
                showOn: 'button',
                buttonText: 'Choose Date',
                dateFormat: 'MM/dd'
            }).on('changeDate', function (ev) {
                

                var endDate = new Date(ev.date);
                var endDateDay = endDate.getDate();
                var endDateMonth = endDate.toLocaleString('default', { month: 'long' }); 
                $scope.endDateistence = endDateMonth+' '+endDateDay;                
            });
        },1000);
    });*/

    $scope.removeEndDate = function(){
        $scope.endDateistence = "";
    }

    var lastAPIHit = 0;
    var lastAPIHitDelay = 20;
    $scope.saveFilterLocalTemplate = function(withCheckList=false, addJob=false) {  
        $scope.errorProductForm = '';
        $scope.successProductForm = ""
        $('.has-error').removeClass('has-error');
        var isError = false;     
        // if(!$scope.oneJobModel.job.jobTitle){
        //     // $("#tempTitle").addClass("has-error");            
        //     // isError = true;
        // } 
        let frequencyStr = $scope.oneJobModel.job.frequency ? $scope.oneJobModel.job.frequency + '' : '';
        if($scope.oneJobModel.job.how_often == 'every' && ($scope.oneJobModel.job.frequency == 0 || !$scope.oneJobModel.job.frequency || frequencyStr.includes('.'))){
            //$scope.errorProductForm = 'Please enter valid frequency';
            $("#frequency_val").addClass("has-error");            
            isError = true;            
        }
        if ($scope.oneJobModel.job.how_often == 'specific' && $scope.oneJobModel.job.dates.length == 0){
            $scope.errorProductForm = 'Please enter valid dates';
            setTimeout(function() {                           
                $scope.errorProductForm = "";
            }, 2000);  
            if (!$scope.$$phase) $scope.$apply();
            isError = true;
        }
        
        if($scope.oneJobModel.job.ends_on == 'specific' && !$scope.endDateistence){
            $("#end_cal_parent").addClass("has-error");
            isError = true;
            $scope.endDateistence = "";
        }

        if(isError){
            return;
        }

        if(typeof $scope.oneJobModel.job.duration == "object" && moment($scope.oneJobModel.job.duration, 'HH:MM',true).isValid()){
            var jobDuration = moment($scope.oneJobModel.job.duration).format('HH:mm').toString();
        } else {
            var jobDuration = $scope.oneJobModel.job.duration;
        }
        if (jobDuration == "Invalid Date") {                      
            jobDuration = '00:00'
        }
        jobDuration = typeof jobDuration == "string" && jobDuration.slice(-5);
        let timeRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(jobDuration)) {
            jobDuration = '00:00';
        }
        $scope.$parent.isProcessing = true;
        $scope.isProcessing = true;
        addJob = ($scope.currentEqp.detail.isSchedule && $scope.addJob) ? 1 : 0;
        let saveJobTemplateData = {
            "id":$scope.eqpTempelateId,
            "title":$scope.oneJobModel.job.jobTitle,
            "addressId":$scope.addressId,
            "isSystem": 1,
            "instruction": $scope.oneJobModel.job.instruction,
            "duration": jobDuration,
            "officeNote": $scope.oneJobModel.job.note,
            "status": 1,
            "templateName": $scope.oneJobModel.job.templateName,
            "addJob": addJob,
            "isModalOpen": $rootScope.editFilterLocalisOpening ? 1 : 0 
        };

        saveJobTemplateData['endDate'] = $scope.oneJobModel.job.ends_on == 'never' ? '' : moment($scope.endDate).format('YYYY-MM-DD').toString();

        if($scope.oneJobModel.job.how_often == 'every'){
            saveJobTemplateData['frequency'] = $scope.oneJobModel.job.frequency;
            saveJobTemplateData['dates'] = '';
        }else{
            saveJobTemplateData['frequency'] = 0;
            saveJobTemplateData['dates'] = $scope.oneJobModel.job.dates;
        }
        
        if (saveJobTemplateData['dates'] && saveJobTemplateData['dates'].length > 0) {
            var datesArr = saveJobTemplateData['dates'];
            var updatedDateArr = [];
            datesArr.forEach(function(xdate){
                var notFormattedDate = xdate.date;
                var notFormattedDateArr = notFormattedDate.split('-');
                var zdate = notFormattedDateArr[0];
                zdate = Number(zdate);
                if (zdate < 10) {
                    zdate = '0' + zdate;
                }
                var zmonth = notFormattedDateArr[1];
                zmonth = Number(zmonth);
                if (zmonth < 10) {
                    zmonth = '0' + zmonth;
                }
                var zyear = notFormattedDateArr[2];
                updatedDateArr.push({ date: zdate+'-'+zmonth+'-'+zyear  })
            });
            saveJobTemplateData['dates'] = updatedDateArr;
        }
        
        /* if(parseInt($scope.bundleTotalTemp) >= 0){ */
            $scope.errorDiscountTemp = false;
            if (lastAPIHit >= (Date.now() - lastAPIHitDelay)) {
                return;
            } else {
                lastAPIHit = Date.now();
                $scope.apiProcessing.one_job_template = true;
                apiGateWay.send("/one_job_template", saveJobTemplateData).then(function(response) {
                    $timeout(function(){
                        $scope.apiProcessing.one_job_template = false;
                    }, 500)   
                    if (response.data.status == 201) {
                        $scope.successProductForm = response.data.message;
                            $scope.jobTemplateId = response.data.data.JobTemplateId;
                            $rootScope.templateId = $scope.jobTemplateId;
                            $rootScope.oneJobTemplate = true;
                            let jobTemplateId = $scope.jobTemplateId;
                            setTimeout(function () {
                                $scope.getOneJobTemplate(jobTemplateId)
                                if (withCheckList) {
                                    $rootScope.saveCheckList(jobTemplateId);
                                }
                                $scope.successProductForm = "";
                            }, 100);
                    } else {
                        $scope.errorProductForm = 'Error in saving info. Please try again later.';
                    }
                    $scope.$parent.isProcessing = false;
                    $scope.isProcessing = false;
                },function(error) {            
                    $scope.apiProcessing.one_job_template = false;         
                    $scope.$parent.isProcessing = false;
                    $scope.isProcessing = true;
                    $scope.errorProductForm = error;
                    setTimeout(function() {
                        $scope.errorProductForm = "";
                    }, 2000);
                });
            }
            
        /* } else {
                $scope.errorDiscountTemp = true;
                setTimeout(function() {
                    $scope.errorDiscountTemp = false;
                }, 2000); 
            }  */
        
    }

    $scope.saveOneTimeJobLocal = function(){
        if ($scope.productBundleListNew.length > 0 && !$rootScope.negativeCheckPassed($scope.productBundleListNew)) {
            $scope.errorProductForm = "The product & service total can't be less than $0.00";
            setTimeout(function () {
                $scope.errorProductForm = "";
            }, 2000);
            return;
        }
        if($scope.discountCalculationTemp){
            var discountTitle = $scope.discountValueTemp + $scope.discountTypeTemp;
        } else {
            var discountTitle = "";
        }
        $scope.getTrimmedVals();
        let saveOneTimeJobItem = {
            "itemReference":$scope.productBundleListNew,
            "jobId":$scope.eqpTempelateId,
            "payOption":$scope.payId,
            "subTotalAmount":$scope.bundleSubTotalTemp,
            "discountTitle":discountTitle,
            "discountValue":$scope.discountCalculationTemp,
            "taxTitle":$scope.taxTitleTemp,
            "taxValue":$scope.taxValueTemp,
            "taxPercentValue":$scope.taxPercentValueTemp,
            "totalAmount":$scope.bundleTotalTemp,
            "isTemplate": 1,
            "taxableSubtotalAmount":$scope.taxableSubtotal
        };
        if(saveOneTimeJobItem.itemReference.length == 0) {
            saveOneTimeJobItem.discountTitle = '';
            saveOneTimeJobItem.discountValue = 0;
        }
        $scope.apiProcessing.one_job_item = true;
        apiGateWay.send("/one_job_item", saveOneTimeJobItem).then(function(response) {
            $scope.apiProcessing.one_job_item = false;
            if (response.data.status == 201 || response.data.status == 200) {
                $scope.successProductForm = response.data.message;  
                setTimeout(function() {
                    $scope.successProductForm = "";
                }, 2000);           
            } else {
                $scope.errorProductForm = 'Error';
            }
            $scope.isProcessing = false;
        },function(error) {            
            $scope.apiProcessing.one_job_item = false;           
            $scope.isProcessing = false;
            $scope.errorProductForm = error;
            setTimeout(function() {
                $scope.errorProductForm = "";
            }, 2000);
        });    
    }

    $rootScope.editFilterLocalisOpening = false;
    $scope.addJobTemplatePopup = null;
    $scope.editFilterLocal = function(equipmentInfo){
        $rootScope.editFilterLocalisOpening = true;
        if(equipmentInfo.selectedType.eqType == "DE"){
            $scope.templateNameHeading = "Filter Clean (DE)";
        }
        if(equipmentInfo.selectedType.eqType == "Cartridge"){
            $scope.templateNameHeading = "Filter Clean (Cartridge)";
        }
        if(equipmentInfo.selectedType.eqType == "Working Salt System"){
            $scope.templateNameHeading = "Salt Cell Clean";
        }
        $scope.selectedXeqId = equipmentInfo.detail.eqId;
        $rootScope.templateId = ''; 
        if(equipmentInfo.icon == "saltsystem"){
            $scope.filterClean = false;
            $scope.saltClean = true;
        } else {
            $scope.filterClean = true;
            $scope.saltClean = false;
        }
        $scope.currentEqp = equipmentInfo;
        $scope.eqScheduleError = '';
        $scope.eqScheduleMsg = '';
        $scope.$parent.isProcessing = $scope.isApiProcessing = true;
        $scope.postDataScheduleJob = {
            eqDetailId: equipmentInfo.detail.id,
            isSchedule: equipmentInfo.detail.isSchedule == undefined ? 0 : equipmentInfo.detail.isSchedule,
            addressId : equipmentInfo.detail.addrId,
            waterBodyId : equipmentInfo.detail.waterBodyId,
            eqId : equipmentInfo.detail.eqId,
            typeId : equipmentInfo.selectedType.typeId,
            isModalOpen: $rootScope.editFilterLocalisOpening ? 1 : 0 
        };
        let postData = $scope.postDataScheduleJob;
        $scope.productBundleListNew = []; 
        $scope.isApiProcessing = true;
        $scope.addJobTemplatePopup = ngDialog.open({
            template: 'editFilterLocal.html',
            className: 'ngdialog-theme-default v-center',
            scope: $scope,
            closeByEscape: $scope.productEdit,
            closeByDocument: true,
            preCloseCallback: function() {
                $scope.productEdit = false;
                $rootScope.editFilterLocalisOpening = false;
                $scope.postDataScheduleJob.isModalOpen = 0;
                $rootScope.closeEquipmentPopupCheck();
                $scope.scheduleJob(true);
                $scope.addJobTemplatePopup = null;
            }
        });
        $scope.apiProcessing.schedule_job_1 = true;
        apiGateWay.send("/schedule_job", postData).then(function(response) {
            $scope.apiProcessing.schedule_job_1 = false;
            $scope.$parent.isProcessing = true;
            $scope.productBundleListNew = []

            //Update value in local variables
            var i = 0;
            angular.forEach($scope.equipments, function(item) {  
                if(item.detail.id == equipmentInfo.detail.id){
                    item.detail.isSchedule = equipmentInfo.detail.isSchedule;
                } 
                $scope.equipments[i] = item;
                i++;
            });
            $scope.selectedEquipment =  $scope.equipments.filter(eitem => eitem.eqId == equipmentInfo.eqId); 
            $scope.currentEqp = $scope.selectedEquipment[0];
            if (response.data.data.localTemplateId && response.data.data.localTemplateId != null) {
                $rootScope.getChecklistOneOfJob(response.data.data.localTemplateId);
                $scope.preFillEqpPopup(response.data.data.localTemplateId);
            }
            $scope.$parent.isProcessing = $scope.isApiProcessing = false;
        }, function(error){
            $scope.apiProcessing.schedule_job_1 = false;
            $scope.$parent.isProcessing =  $scope.isApiProcessing = true;
            $scope.eqScheduleError = error;
            setTimeout(function(){
                $scope.eqScheduleError = '';
                $scope.eqScheduleMsg = '';
            },3000);
        })                   
    }

    $scope.scheduleJob = function(isClosed = false){
        addJob = ($scope.currentEqp.detail.isSchedule && $scope.addJob) ? 1 : 0;
        let postData = $scope.postDataScheduleJob;
        if(postData == null){
            return false;
        }
        $scope.productBundleListNew = []
        $scope.isProcessing = true;
        $scope.apiProcessing.schedule_job_2 = true;
        apiGateWay.send("/schedule_job", postData).then(function(response) {
            $scope.apiProcessing.schedule_job_2 = false;
            $scope.$parent.isProcessing = true;
            if (!isClosed && response.data.data.localTemplateId && response.data.data.localTemplateId != null) {
                $scope.preFillEqpPopup(response.data.data.localTemplateId);
                $scope.eqpTempelateId = response.data.data.localTemplateId;
            }
            $scope.saveFilterLocalTemplate(true, addJob);
            $rootScope.editFilterLocalisOpening = false;
            $scope.$parent.isProcessing = $scope.isProcessing = false;
        }, function(error){
            $scope.apiProcessing.schedule_job_2 = false;
            $scope.$parent.isProcessing = $scope.isProcessing = false;
            $scope.eqScheduleError = error;
            setTimeout(function(){
                $scope.eqScheduleError = '';
                $scope.eqScheduleMsg = '';
            },3000);
        })
    }

    $scope.editFilterLocalAPI = function(equipmentInfo){
        $rootScope.editFilterLocalisOpening = true;
        $rootScope.templateId = ''; 
        if(equipmentInfo.icon == "saltsystem"){
            $scope.filterClean = false;
            $scope.saltClean = true;
        } else {
            $scope.filterClean = true;
            $scope.saltClean = false;
        }
        $scope.currentEqp = equipmentInfo;
        $scope.currentEqp.detail.isSchedule == 0 ?  $scope.activateSchedule = true : $scope.activateSchedule = false
        $scope.eqScheduleError = '';
        $scope.eqScheduleMsg = '';
        // $scope.$parent.isProcessing = true;
        var postDataScheduleJob = {
            eqDetailId: equipmentInfo.detail.id,
            isSchedule: equipmentInfo.detail.isSchedule == 1 ? 0 : 1,
            addressId : equipmentInfo.detail.addrId,
            waterBodyId : equipmentInfo.detail.waterBodyId,
            eqId : equipmentInfo.detail.eqId,
            typeId : equipmentInfo.selectedType.typeId,
            isModalOpen: $rootScope.editFilterLocalisOpening ? 1 : 0 
        };
        //Update value in local variables
        var i = 0;
        angular.forEach($scope.equipments, function(item) {  
            if(item.detail.id == equipmentInfo.detail.id){
                item.detail.isSchedule = equipmentInfo.detail.isSchedule == 1 ? 0 : 1;
            } 
            $scope.equipments[i] = item;
            i++;
        });
        $scope.selectedEquipment =  $scope.equipments.filter(eitem => eitem.eqId == equipmentInfo.eqId); 
        $scope.currentEqp = $scope.selectedEquipment[0];

        $scope.postDataScheduleJob = postDataScheduleJob;
        $scope.scheduleJobToggle();
    }
    
    $scope.scheduleJobToggle = function(){
        let postData = $scope.postDataScheduleJob;
        if(postData == null){
            return false;
        }
        $scope.$parent.isProcessing = true;
        $scope.apiProcessing.schedule_job_3 = true;
        apiGateWay.send("/schedule_job", postData).then(function(response) {
            $scope.apiProcessing.schedule_job_3 = false;
            if (response.data.data.localTemplateId && response.data.data.localTemplateId != null) {
                $scope.getOneJobTemplate(response.data.data.localTemplateId);
                $rootScope.getChecklistOneOfJob(response.data.data.localTemplateId);
            }
            $scope.$parent.isProcessing = false;
        }, function(error){
            $scope.apiProcessing.schedule_job_3 = false;
            $scope.$parent.isProcessing = false;
        })
    }
    
    /*Show Equipment Detail*/      
    $rootScope.showEquipmentDetail = function(value) {
        $scope.selectedXeqId = value;
        $timeout(function(){
            var ele = document.getElementsByClassName("arrow");
            if(ele[0]){
                ele[0].focus()
            }              
        }, 100)
       
        $scope.onArrowKeyEvent();   
       
        ngDialog.closeAll()
        $scope.equipmentType = value;
        $scope.model = {
            typeId : '',
            eqDetailId:'',
            notes:'',
            timerValue:'',
            isPresent:'',
            eqImage:[],
            backwashData:{
                valveClosed: 1,
                instStart: 0,
                instEnd: 0,
                instStartData: "",
                backwash: 1,
                backwashId: null,
                instEndData: "",
                required:'1',
                visits:null
            },
            backwashOn:0,
            cleanFilteredData:{
                beforePicture: 1,
                instStart: 0,
                instEnd: 0,
                instStartData: "",
                afterPicture: 1,
                cleanedFilterId: null,
                instEndData: "",
                required:'1',
                weeks:null
            },
            cleanSaltCellData:{
                beforePicture: 1,
                instStart: 0,
                instEnd: 0,
                instStartData: "",
                afterPicture: 1,
                CleanedSaltId: null,
                instEndData: "",
                required:'1',
                weeks:null
            }
        };
        
        $scope.cleanFilteredData.instructionsBefore = false;
        $scope.cleanFilteredData.instructionsAfter = false;
        $scope.cleanFilteredData.beforePicture = true;
        $scope.cleanFilteredData.afterPicture = true;

        $scope.cleanSaltCellData.instructionsBefore = false;
        $scope.cleanSaltCellData.instructionsAfter = false;
        $scope.cleanSaltCellData.beforePicture = true;
        $scope.cleanSaltCellData.afterPicture = true;

        $scope.backwashData.instructionsBefore = false;
        $scope.backwashData.instructionsAfter = false;
        $scope.Backwash = true;
        $scope.closeBackwashValve = true;


        $scope.equipmentNext = '';
        $scope.equipmentPrev = '';

        $scope.tempTypeId = '';
        $scope.tempNotes ='';
        $rootScope.getEquipmentDetails();

        $scope.selectedEquipment =  $scope.equipments.filter(eitem => eitem.eqId == value); 
        $scope.currentEqp = $scope.selectedEquipment[0];
        if($scope.selectedEquipment[0].selectedType.typeId){
            $scope.tempTypeId = $scope.selectedEquipment[0].selectedType.typeId;
            $timeout(function(){
                document.getElementById('type'+$scope.selectedEquipment[0].selectedType.typeId).click();           
            }, 100)
        }
        if($scope.selectedEquipment[0].detail.notes){
            $scope.model.notes = $scope.selectedEquipment[0].detail.notes;
            $scope.tempNotes = $scope.selectedEquipment[0].detail.notes;
        } else {
            $scope.selectedEquipment[0].detail.notes = '';
            $scope.tempNotes ='';
        }
        if($scope.selectedEquipment[0].detail.timerValue){
            $scope.model.timerValue = $scope.selectedEquipment[0].detail.timerValue;
        }
        if($scope.selectedEquipment[0].detail.isPresent){
            $scope.model.isPresent = $scope.selectedEquipment[0].detail.isPresent;
        }
        if($scope.selectedEquipment[0].detail.id){
            $scope.model.eqDetailId = $scope.selectedEquipment[0].detail.id;
        }
        /*backwash filling*/  
        $scope.showBackwashFunc();
        $scope.showFilterCleaningFunc();
        $scope.showSaltCellCleaningFunc();
        $scope.photos =  Object.assign([], $scope.selectedEquipment[0].detail.images);       


        if($scope.availableEquipmentID.indexOf(value) > -1){
        angular.forEach($scope.availableEquipmentID, function(item, index){            
            if(item == value){
                if(!$scope.availableEquipmentID[index+1]){
                    $scope.equipmentNext = $scope.availableEquipmentID[0];                    
                } else {
                    $scope.equipmentNext = $scope.availableEquipmentID[index+1];
                }
                if(!$scope.availableEquipmentID[index-1]){
                    $scope.equipmentPrev = $scope.availableEquipmentID[$scope.availableEquipmentID.length-1];                
                } else {
                    $scope.equipmentPrev = $scope.availableEquipmentID[index-1];
                }
        
            }
        })
        
        ngDialog.open({
            id  : 10,
            template: 'equipmentDetails.html',
            className: 'ngdialog-theme-default v-center',
            name:'equipmentDetailPopup',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function() {
                $scope.successMsg = '';
                $scope.error = '';
                $scope.isCleanSaltCellDataCounterUpdated = false;
                $scope.isCleanFilteredDataCounterUpdated = false;
                $scope.isBackwashDataCounterUpdated = false;
                $scope.lastBackWashedDatesPopup = false;
                $scope.saltCleanedHistoryDatesPopup = false;                
                $scope.waterLevelLowHistoryDatesPopup = false;
                $scope.lastFilterCleanedDatesPopup = false;
                $scope.model = {};
                $scope.selectedEquipment = {};
                $scope.photos = [];
                $scope.errorImage = "";
                $scope.logBox.status = false;
                $scope.selectedXeqId = null;
                if (typeof $rootScope.refreshWBSection == 'function') {
                    $rootScope.refreshWBSection();
                }
                $timeout(function(){
                    $rootScope.getEquipmentDetails();          
                }, 100)
                $scope.togglePodInput('hide');
            }
        });
        
    }

    };
    $scope.focusOnInvalidInput= function(isValid) {      
        if (!isValid) {         
            angular.element('input.ng-invalid').first().focus();
        } else {
            if($scope.photos.length == 0 || $scope.errorImage){   
                $scope.focusOnImageError();
            }
        }           
    };
    
   $scope.confirmBeforeSave = function(id){
        if(!$scope.model.typeId && !$scope.model.eqDetailId){           
            
            $scope.saveDataForUnknownAlert();            
        } else if(!$scope.model.typeId && ($scope.model.notes || $scope.model.eqImage.length > 0)){
            $scope.saveDataConfirm();
        } else {
            $scope.saveEquipmentDetail(id, $scope.model)
        }

   }
    $scope.focusOnImageError = function(){
        $timeout(function(){
            var divElem = document.getElementsByClassName('detail-box')[0];
            var chElem = document.getElementById('imageError');
            var topPos = divElem.offsetTop;
            divElem.scrollTop = chElem.offsetTop - topPos;
        }, 100)
       
    } 
    
    var msgInterval;
    $scope.saveEquipmentDetail = function(equipmentId, model){   
        $scope.isApiProcessing = true;
        if (equipmentId == 8) {
            $scope.isProcessing = true;
        }
        if (msgInterval) {
            clearInterval(msgInterval);
            msgInterval = null;
        }
        if(!model.eqDetailId){
            $scope.isProcessing = true;  
        }
        var postData = {            
            "companyId": $scope.companyId,
            "userId": $scope.userId,
            "addressId" : $scope.addressId,
            "equipmentId": equipmentId,
            "typeId" :  model.typeId,
            "eqDetailId" :  model.eqDetailId,
            "notes": model.notes,
            "timerValue": model.timerValue,
            "isPresent":1,
            "eqImage":model.eqImage
        }

        if($scope.showBackwash){
            postData.backwashData = model.backwashData;
            if(model.backwashData && model.backwashData.instStart == 0){
                postData.backwashData.instStartData = '';
            }
            if(model.backwashData && model.backwashData.instEnd == 0){
                postData.backwashData.instEndData = '';
            }           
            if(model.backwashData && !model.backwashData.instStartData){
                postData.backwashData.instStart = 0;
            }
            if(model.backwashData && !model.backwashData.instEndData){
                postData.backwashData.instEnd = 0;
            }
            
        }
        if(!model.typeId || model.typeId == undefined || model.typeId == 0 || model.typeId == 7){
            postData.timerValue = '';
            $scope.model.timerValue = '';
        }
        if(['4','7','10','14','20','21','27'].indexOf((model.typeId).toString()) > -1){
            postData.isPresent = 0;
          
        }

        $scope.errorImageFormat = "";
        postData.waterBodyId = $scope.selectedWaterBody.id;
        // START -- if equipment is waterGuru
        if (postData.equipmentId == 8) {
            postData.isPresent = 0;            
            $scope.isPodIdAdding = false;
            $scope.isPodIdRemoving = false;  
            if (model.savingPodId || model.removingPodId) {
                $scope.isPodIdAdding = model.savingPodId || false;
                $scope.isPodIdRemoving = model.removingPodId || false;
                let podId = angular.copy(model._podId)
                postData.eqAction = model.savingPodId ? "linkPodId" : "unlinkPodId";
                postData.podId = podId
                delete model.savingPodId;
                delete model._podId;     
                if ($scope.isPodIdRemoving) {
                    $scope.unlinkModal.close();
                }
                if(postData.eqAction == "linkPodId") {
                    postData.isPresent = 1;
                } 
                if(postData.eqAction == "unlinkPodId") {
                    postData.isPresent = 0;
                }  
                // remove unused nodes
                if (postData.hasOwnProperty('eqImage')) delete postData.eqImage;
                if (postData.hasOwnProperty('notes')) delete postData.notes;          
                if (model.hasOwnProperty('_podId')) delete model._podId;
                if (model.hasOwnProperty('savingPodId')) delete model.savingPodId;
                if (model.hasOwnProperty('removingPodId')) delete model.removingPodId;
            }
            if ($scope.selectedEquipment[0]?.detail?.podDetails?.podId && postData.eqAction != "unlinkPodId") {
                postData.isPresent = 1;
                postData.podId = Number($scope.selectedEquipment[0].detail.podDetails.podId);
            }
            if (postData.hasOwnProperty('backwashData')) delete postData.backwashData;
            if (postData.hasOwnProperty('timerValue')) delete postData.timerValue;
            if (postData.hasOwnProperty('typeId')) delete postData.typeId;
        }
        // END -- if equipment is waterGuru 
        $scope.apiProcessing.equipments = true;
        apiGateWay.send("/equipments", postData).then(function(response) {  
            $scope.apiProcessing.equipments = false;
            if (response.data.status == 201) {
                if(response.data.data.imageId!=='' && typeof response.data.data.imageId == 'number'){
                    $scope.photos[$scope.photos.length-1].id = response.data.data.imageId;
                }
                angular.forEach($scope.equipments, function(item) {
                    if(item.eqId == equipmentId){
                        // var equipmentAdditionalData = $scope.equipments.filter(eitem => eitem.eqId == equipmentId); 
                        // equipmentAdditionalData[0].detail = response.data.data.addressEqList;
                        item.detail = response.data.data.addressEqList ?  response.data.data.addressEqList : {}; 
                    }
                });
                $scope.successMsg = response.data.message;
                $scope.model.eqDetailId = response.data.data.equipmentDetailId;
                $scope.selectedEquipment[0].detail.id = response.data.data.equipmentDetailId               
                $scope.model.eqImage = [];
                $scope.tempTypeId = $scope.model.typeId;
                $scope.tempNotes = $scope.model.notes;
                $scope.isToggleIconChanging = true; // for save initial data
                if(postData.typeId == 1){ //Filter - Sand
                    $scope.saveDetails('backwashData');
                }                            
                if(postData.typeId == 2){ //Filter - Cartridge
                    $scope.saveDetails('cleanFilteredData');
                }
                if(postData.typeId == 3){ //Filter - DE
                    $scope.saveDetails('cleanFilteredData');
                    $scope.saveDetails('backwashData');                 
                }
                if(postData.typeId == 18){
                    $scope.saveDetails('cleanSaltCellData'); 
                }

                
                //$scope.getEquipmentDetails();
                if ($scope.isPodIdRemoving) {
                    $scope.togglePodInput('hide');
                }
                $scope.isPodIdRemoving = false;
                $scope.isPodIdAdding = false;
                
            } else {
                $scope.isPodIdRemoving = false;
                $scope.isPodIdAdding = false;
                $scope.successMsg = '';
                $scope.error = response.data.message;
            }
            $scope.isApiProcessing = false;
            msgInterval = setTimeout(function() {                
                //$scope.selectedEquipment =  $scope.equipments.filter(eitem => eitem.eqId == equipmentId); 
                $scope.error = '';
                $scope.successMsg = '';              
                $scope.isProcessing = false;                
                // ngDialog.closeAll();
                if (!$scope.$$phase) $scope.$apply()                
            }, 3000);
        }, function(error) {  
            $scope.apiProcessing.equipments = false; 
            $scope.isPodIdRemoving = false;
            $scope.isPodIdAdding = false;
            var msg = 'Error';
            if (typeof error == 'object' && error.data && error.data.message) {
                msg = error.data.message;
            } else {
                msg = error;
            }
            $scope.successMsg = '';
            $scope.error = msg;
            $scope.isProcessing = false;
            $scope.isApiProcessing = false;
            msgInterval = setTimeout(function() {
                $scope.error = '';
                if (!$scope.$$phase) $scope.$apply()
            }, 3000);
        });
   
      }
      $scope.browseImage = function() {      
          if($scope.photos.length < 30){
            document.getElementById("equipmentPhoto").click();
            $scope.errorImage = "";
          } else {            
            $scope.errorImage = "Maximum 30 images you can upload.";
            $scope.focusOnImageError();
          }
          
      };
      $scope.deleteEqImage = function() {
        $scope.deleteImagePopup.close();
        let id = $scope.eqImageId;     
        $scope.isProcessing = true;
        apiGateWay.send("/delete_equipment_asset", {"id":id}).then(function(response) {  
            if (response.data.status == 200) {
               /* var el = angular.element( 
                    document.querySelector('#eq-img-'+id)); 
                el.remove(); */
                $scope.photos.splice($scope.eqImageIndex, 1);
                $scope.successMsg = response.data.message;      
            } else {
                $scope.successMsg = '';
                $scope.error = response.data.message;
            }
            $scope.isProcessing = false;
            setTimeout(function() {
                $scope.error = '';
                $scope.successMsg = '';
                $scope.isProcessing = false;
            }, 2000);
        }, function(error) {  
            var msg = 'Error';
            if (typeof error == 'object' && error.data && error.data.message) {
                msg = error.data.message;
            } else {
                msg = error;
            }
            $scope.successMsg = '';
            $scope.error = msg;
            $scope.isProcessing = false;
            setTimeout(function() {
                $scope.error = '';
                $scope.isProcessing = false;
                if (!$scope.$$phase) $scope.$apply()
            }, 2000);
        });
     };
      
    $scope.uploadFile = function($event, eqId) {
        $scope.isProcessing = true;
        $scope.errorImage = "";
        var imageData = $scope.model.equipmentPhoto;
        if(imageData.filename){
            if(["image/gif", "image/png", "image/jpeg"].indexOf(imageData.filetype) != -1){
            $scope.photos.push({filePath:"data:image/png;base64," + imageData.base64});
            $scope.model.eqImage.push({filePath:"data:image/png;base64," + imageData.base64, filename:imageData.filename, filetype:imageData.filetype});
            $scope.model.equipmentPhoto = {};
            $scope.saveEquipmentDetail(eqId, $scope.model);
            
            }else{  
                $scope.isProcessing = false;                      
            $scope.errorImage = "Please select image format in JPEG, PNG or GIF.";
            $scope.focusOnImageError(); 
            }
        } else {
            $scope.isProcessing = false;
        }
    };
    $scope.showBackwashFunc = function(){           
        if(['2','20'].indexOf($scope.model.typeId.toString()) == -1){ //type is Sand or DE      
        $scope.showBackwash = true;
        } else {
        $scope.showBackwash = false;
        }
    }

    $scope.showFilterCleaningFunc = function(){           
        if(['1','20'].indexOf($scope.model.typeId.toString()) == -1){ //type is Sand or DE      
          $scope.showCleanedFilter = true;
        } else {
          $scope.showCleanedFilter = false;
        }
    }

    $scope.showSaltCellCleaningFunc = function(){           
        if(['21'].indexOf($scope.model.typeId.toString()) == -1){ //type is Sand or DE      
          $scope.showCleanedSaltCell = true;
        } else {
          $scope.showCleanedSaltCell = false;
        }
    }

    $scope.resetTimerValue = function(){  
        if($scope.model.typeId.toString() == '19'){ //type is Sand or DE      
            $scope.model.timerValue = '24';
        } else if($scope.model.typeId.toString() == '7'){ 
            $scope.model.timerValue = '';
        } 
    }
    $scope.radioPrevState = '';
     $scope.onChangeRadio = function(e, eqId, eqType){
        $scope.selectedEquipment[0].selectedType = eqType;
        $scope.selectedXeqId = eqId;
        $scope.gettingDetailsradionchange = true;
        //  $scope.currentEqp = selectedEquipment;
         setTimeout(function(){
            if ($scope.model.typeId === '') {
                $scope.currentEqp.detail.isSchedule = 0;
            } 
         }, 100)
        //  $scope.currentEqp.detail.isSchedule = e.target.value > 0 ? 0 : undefined;
         if ($scope.radioPrevState === e.target && e.target.checked) {
            e.target.checked = false;
            $scope.radioPrevState = null; 
            $scope.model.typeId = '';            
          } else {
            $scope.radioPrevState = e.target;
          }
          $timeout(function(){
            $scope.showBackwashFunc();
            $scope.showFilterCleaningFunc();
            $scope.showSaltCellCleaningFunc();            
            $scope.resetTimerValue();    
            $rootScope.getEquipmentDetails();              
          }, 200)
          
          if($scope.model.typeId != $scope.tempTypeId){
            $scope.saveEquipmentDetail(eqId, $scope.model)  
                 
          } 
          $rootScope.getEquipmentDetails();
          $('input[name="etype"]').blur();
          
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
    $scope.isTypeSelected = function(type){
        if(type == 'backwashData' && ['1','3'].indexOf($scope.model.typeId.toString()) > -1){
            return true;           
        } else if(type == 'cleanFilteredData' && ['2','3'].indexOf($scope.model.typeId.toString()) > -1) {      
            return true;
        } else if(type == 'cleanSaltCellData' && ['18'].indexOf($scope.model.typeId.toString()) > -1){
            return true;
        } else {
            return false;
        }
    }
    $scope.isToggleIconChanging = false;
    $scope.toggleIcons = function(type, value){     
        $scope.isToggleIconChanging = true;
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
  
    $scope.openTypeValidation = function(){    
        $scope.deletePopup = ngDialog.open({
            template: 'typeValidation.html',
            className: 'ngdialog-theme-default',
            scope: $scope,
            preCloseCallback: function () {    
            }
        });
      }
    /*Backwash methods Start*/
    $scope.saveDetails = function(type, value){ 
        if($scope.showBackwash || $scope.showCleanedFilter || $scope.showCleanedSaltCell){
            if (!$scope.isToggleIconChanging) {            
                if (type == 'backwashData') { 
                    if ($scope.model[type].visits == $scope.cachedBackwashDataVisits) {
                        return                
                    }
                }
                if (type == 'cleanFilteredData') { 
                    if ($scope.model[type].weeks == $scope.cachedCleanFilteredDataWeeks) {
                        return                
                    }
                }
                if (type == 'cleanSaltCellData') { 
                    if ($scope.model[type].weeks == $scope.cachedCleanSaltCellDataWeeks) {
                        return                
                    }
                }
            }
            $scope.isToggleIconChanging = false;
           // $scope.isProcessing = true;  
            var postData = {}             
                    
            var apiUrl = '';          
            if(type == 'backwashData'){
                apiUrl = '/backwash';
            }  
            if(type == 'cleanFilteredData'){
                apiUrl = '/cleanedfilter';
            } 
            if(type == 'cleanSaltCellData'){
                apiUrl = '/cleanedsalt';
            } 
            postData[type] = angular.copy($scope.model[type]);    
            if(type == 'backwashData' && $scope.model[type].visits == 1){
                $scope.model[type].visits = '';
                postData[type].visits = 0;
            }
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
            if((type == 'cleanFilteredData' || type == 'cleanSaltCellData') && ($scope.model[type].weeks == 1 || $scope.model[type].weeks == null)){
                $scope.model[type].weeks = '';
                postData[type].weeks = 0;
            }           

            if($scope.model[type].required == 1 || $scope.model[type].required == 2){
                postData[type].required = $scope.model[type].required == 2 ? 1 : 0;                 
                if(type == 'backwashData'){
                    $scope.model[type].visits = null
                    postData[type].visits = 0;
                }     
                
            } else if(($scope.model[type].required == 3 && $scope.model[type].visits) || ($scope.model[type].required == 3 && $scope.model[type].weeks)) {
                postData[type].required = 0
            } else {
                postData[type].required = 1
            }

            
            postData[type].addressId = $scope.addressId;      
            postData[type].waterBodyId = $scope.selectedWaterBody.id;     
            if(type == 'backwashData'){ $scope.cachedBackwashDataVisits =  postData[type].visits }
            if(type == 'cleanFilteredData'){ $scope.cachedCleanFilteredDataWeeks =  postData[type].weeks }
            if(type == 'cleanSaltCellData'){ $scope.cachedCleanSaltCellDataWeeks =  postData[type].weeks }
            apiGateWay.send(apiUrl, postData).then(function(response) {  
                if (response.data.status == 200) {
                    $scope.successMsg = response.data.message;
                    if(type == 'backwashData'){
                        $scope.model[type].backwashId = response.data.data.backwashId    
                    }  
                    if(type == 'cleanFilteredData'){
                        $scope.model[type].cleanedFilterId = response.data.data.cleanedFilterId
                    } 
                    if(type == 'cleanSaltCellData'){
                        $scope.model[type].CleanedSaltId = response.data.data.CleanedSaltId
                    } 
                    
                    //$scope.getEquipmentDetails();
                    if(type && value){
                        $scope.hideInstructionPopup(type, value);
                    }
                   
                    
                } else {
                    $scope.successMsg = '';
                    $scope.error = response.data.message;
                } 
                $scope.gettingDetailsradionchange = false           
                setTimeout(function() {                   
                    $scope.error = '';
                    $scope.crossClicked = false;
                    $scope.successMsg = '';
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
                $scope.successMsg = '';
                $scope.error = msg;
                $scope.isProcessing = false;
                setTimeout(function() {
                    $scope.error = '';
                    $scope.isProcessing = false;
                    if (!$scope.$$phase) $scope.$apply()
                }, 2000);
            });

        }    
    }
    $scope.setRequired = function(type){
        if(['1','2'].indexOf($scope.model[type].required) > -1){
            if(type == 'backwashData'){
                $scope.model[type].visits = null;
            } else {
                $scope.model[type].weeks = null;
            }
            $scope.saveDetails(type);
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
                    $scope.model.backwashData.required = '2';
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
                    $scope.model.cleanFilteredData.required = '2';
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
                    $scope.model.cleanSaltCellData.required = '2';
                }
                $scope.model.cleanSaltCellData.weeks= null;
                //$scope.model.cleanSaltCellData.required = '1';
            }
        }
        
    }, true);

   


    $scope.eraseDataConfirm = function() {
        ngDialog.open({
          template: 'eraseDataConfirm.html',
          className: 'ngdialog-theme-default',
          scope: $scope,          
      });     
    };
    $scope.saveDataConfirm = function() {
        ngDialog.open({
          template: 'saveDataConfirm.html',
          className: 'ngdialog-theme-default',
          scope: $scope,          
      });     
    };
    $scope.saveDataForUnknownAlert = function() {
        $scope.crossClicked = false;
        ngDialog.open({
          template: 'saveDataForUnknownAlert.html',
          className: 'ngdialog-theme-default',
          scope: $scope,          
      });     
    };
    $scope.eraseData = function(){
        $scope.isProcessing = true;
        apiGateWay.send("/delete_equipment", {"eqDetailId":$scope.model.eqDetailId, addressId:$scope.addressId }).then(function(response) {  
            if (response.data.status == 200) {
                $scope.successMsg = response.data.message;                
                $rootScope.getEquipmentDetails();
                ngDialog.closeAll();
            } else {
                $scope.successMsg = '';
                $scope.error = response.data.message;
            }
            $scope.isProcessing = false;
            setTimeout(function() {
                $scope.error = '';
                $scope.successMsg = '';
                $scope.isProcessing = false;
                if (!$scope.$$phase) $scope.$apply()
            }, 2000);
        }, function(error) {  
            var msg = 'Error';
            if (typeof error == 'object' && error.data && error.data.message) {
                msg = error.data.message;
            } else {
                msg = error;
            }
            $scope.successMsg = '';
            $scope.error = msg;
            $scope.isProcessing = false;
            setTimeout(function() {
                $scope.error = '';
                $scope.isProcessing = false;
                if (!$scope.$$phase) $scope.$apply()
            }, 2000);
        });
    }
    $scope.showFullScreenImages = function(index){
        $(document).bind('keydown', function (e) {    
            var ele = document.getElementsByClassName("full-screen-gallery");            
            if(ele.length == 0) return;
            var carouselPrev = document.getElementsByClassName("carousel-prev");
            var carouselNext = document.getElementsByClassName("carousel-next");
            switch (e.key) {               
                case 'ArrowLeft':              
                    carouselPrev[carouselPrev.length-1].click();    
                    break;
                case 'ArrowRight':
                    carouselNext[carouselNext.length-1].click();          
            }          
        });
        $scope.imageInitialIndex = index;    
        ngDialog.open({
            template: 'picturesGallery.html',
            className: 'ngdialog-theme-default',
            scope: $scope,
            preCloseCallback: function() {
                $scope.imageInitialIndex = 999;
            }
        });
    }
    $scope.openLastDatePopup = function(value){
        $scope[value] = !$scope[value]; 
        
        var obj = value.replace('sPopup','');       
        $scope[obj+'Ten'] = $scope[obj].filter((item,index)=>{
            if(index > 9){return;}
            return item;
        });
        
            if( $scope[obj].length > 10){
                $scope[obj+'TenSeeMore'] = true;
            } else {
                $scope[obj+'TenSeeMore'] = false;
            }     
         
         
    }
    $scope.closeLastDatePopup = function(value){
        $scope[value] = !$scope[value];        
    }
    $scope.seeMoreDates = function(value){
        var fullObj = value.replace('Ten','');
        $scope[value] = $scope[fullObj];
        $scope[value+'SeeMore'] = false;
    }

    
    $scope.saveTimer = function(eqId){        
        if($scope.model.timerValue && $scope.model.typeId ) {
            $scope.saveEquipmentDetail(eqId, $scope.model)
        } 
    }
    $scope.saveNotes = function(eqId){
        if($scope.model.notes !== $scope.tempNotes ) {
            $scope.saveEquipmentDetail(eqId, $scope.model)
        } 
    }

 

    $rootScope.$on('ngDialog.opened', function (e, $dialog) {     
           
            $timeout(function(){
                $('.datepicker-custom-inline.log-date').datepicker({
                    endDate: new Date(),
                    autoclose: true,
                    todayBtn: "linked",
                    format: 'mm/dd/yyyy',
                });   
                $('.datepicker-custom-inline.log-date').on('changeDate', function() {              
                    $scope.logBox.model = $('.datepicker-custom-inline.log-date').datepicker('getFormattedDate');                    
                });
            }, 1000)
                     
            /*if($scope.model.endDate){
                $('.datepicker-custom-input').datepicker('update', new Date(moment($scope.model.endDate)));         
            }*/
               
      });
      $scope.openLogDatePopup = function(type){
        $scope.logBox = {
            status : true,
            type: type,
            model: ''
        }       
         
      }
      $scope.saveLog = function(type){      
        var date = angular.copy(new Date($scope.logBox.model+' 00:00:00'));
        var utcDay = moment.utc(date).format('YYYY-MM-DD HH:mm:ss');
        var postData = { 
            "addressId":$scope.addressId,
            "date":$scope.logBox.model,
            "checklistType":type,
            "utcDate": utcDay,
            "waterBodyId":$scope.selectedWaterBody.id,
            "typeId":$scope.model.typeId
        }
        $scope.logBox = {
            status : false,
            type: '',
            model: ''
        }
        apiGateWay.send("/log_system_checklist_v2", postData).then(function(response) {  
            if (response.data.status == 200) {  
                $('.datepicker-custom-inline.log-date').datepicker('update', new Date());
                $scope.successMsg = response.data.message;
                $rootScope.getEquipmentDetails();
            } else {
                $scope.successMsg = '';
                $scope.error = response.data.message;
            }          
            setTimeout(function() {
                $scope.error = '';
                $scope.successMsg = '';                
                if (!$scope.$$phase) $scope.$apply()
            }, 2000);
        }, function(error) {  
            $scope.error = error
            var msg = 'Error';
            if (typeof error == 'object' && error.data && error.data.message) {
                msg = error.data.message;
            } else {
                msg = error;
            }
            setTimeout(function() {
                $scope.error = '';                
                if (!$scope.$$phase) $scope.$apply()
            }, 2000);
        });
    }

    $scope.deleteImageConfirm = function(id,index){
        $scope.eqImageId = id; 
        $scope.eqImageIndex = index;                 
        $scope.deleteImagePopup = ngDialog.open({            
            id  : 12,
            template: 'deleteImageConfirm.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function () {
            }
        });
    }
    $scope.defaultTaxSettingData = {};
    $scope.getDefaultTaxData = function() {
        apiGateWay.send("/quotes_tax", {
            "companyId" : $scope.companyId,
            "addressId" : $stateParams.addressId
        }).then(function(response) {
            if (response.data.status == 200) {
              $scope.defaultTaxSettingData = response.data.data.defaultTaxSettingData;     
            }   
        }, function(error){
        })
    }
    $scope.taxableSubtotal = 0;
    $scope.getSubtotalForTax = function () {         
        var totalAmountForApplyTax = 0;
        $scope.taxableSubtotal = 0;
        if ($scope.discountCalculationTemp > 0) {
            angular.forEach($scope.productBundleListNew, (element, index) => {
                element.lineItemTaxableAmount = 0;
                if (element.isChargeTax == 1 && element.category !== 'Bundle') {
                    var itemAmount = $rootScope.negativeRoundUp((element.qty) * (element.price));
                    var itemsContributionPercent = (((itemAmount/($scope.bundleSubTotalTemp))*100));
                    var discountOnThisItem = $rootScope.negativeRoundUp((($scope.discountCalculationTemp*(itemsContributionPercent))/100));
                    var itemAmountAfterDiscount = $rootScope.negativeRoundUp(itemAmount-discountOnThisItem);
                    totalAmountForApplyTax = $rootScope.negativeRoundUp(totalAmountForApplyTax + (itemAmountAfterDiscount));
                    element.lineItemTaxableAmount = itemAmountAfterDiscount;
                }
                if (element.bundleItemReference && element.bundleItemReference.length) {
                    var bundleTaxableAmount = 0;
                    angular.forEach(element.bundleItemReference, (element2, index2) => {
                        element2.lineItemTaxableAmount = 0;
                        if (element2.isChargeTax == 1) {
                            var itemAmount = $rootScope.negativeRoundUp((element2.qty) * (element2.price));
                            var itemsContributionPercent = (((itemAmount/($scope.bundleSubTotalTemp))*100));
                            var discountOnThisItem = $rootScope.negativeRoundUp((($scope.discountCalculationTemp*(itemsContributionPercent))/100));
                            var itemAmountAfterDiscount = $rootScope.negativeRoundUp(itemAmount-discountOnThisItem);
                            totalAmountForApplyTax = $rootScope.negativeRoundUp(totalAmountForApplyTax + (itemAmountAfterDiscount));
                            element2.lineItemTaxableAmount = itemAmountAfterDiscount;
                            bundleTaxableAmount = bundleTaxableAmount + (itemAmountAfterDiscount);
                        } 
                    });
                    element.lineItemTaxableAmount = bundleTaxableAmount;
                }
            });
        } else {
            angular.forEach($scope.productBundleListNew, (element, index) => {
                element.lineItemTaxableAmount = 0;
                if (element.isChargeTax == 1 && element.category !== 'Bundle') {
                    totalAmountForApplyTax = totalAmountForApplyTax + $rootScope.negativeRoundUp((element.qty) *( element.price));
                    element.lineItemTaxableAmount = $rootScope.negativeRoundUp((element.qty) * (element.price));
                }
                if (element.bundleItemReference && element.bundleItemReference.length) {
                    var bundleTaxableAmount = 0;
                    angular.forEach(element.bundleItemReference, (element2, index2) => {
                        element2.lineItemTaxableAmount = 0;
                        if (element2.isChargeTax == 1) {                            
                            var amount = $rootScope.negativeRoundUp((element2.qty) * (element2.price));
                            totalAmountForApplyTax = totalAmountForApplyTax + (amount);
                            element2.lineItemTaxableAmount = amount;
                            bundleTaxableAmount = bundleTaxableAmount + (amount);
                        } 
                    });
                    element.lineItemTaxableAmount = bundleTaxableAmount;
                }
            });
        }
        if($scope.discountTitleTemp === '100%') {
            totalAmountForApplyTax = 0;
        }
        $scope.taxableSubtotal = totalAmountForApplyTax;        
        $scope.getTrimmedVals();     
        return totalAmountForApplyTax;
    }
    $scope.$watch('bundleSubTotalTemp', function() {            
        $scope.getTrimmedVals();
        if ($scope.taxTitle != '') {
            $scope.chargeTax();        
        }
    });
    $scope.$watch('discountCalculationTemp', function() {            
        $scope.getTrimmedVals();
    });
    $scope.$watch('taxValueTemp', function() {            
        $scope.getTrimmedVals();
    });
    $scope.chargeTax = function() {        
        if ($scope.taxTitleTemp == '' || $scope.taxTitleTemp === undefined || $scope.taxTitleTemp === null) {
            var companyId = {
                title: $scope.defaultTaxSettingData.companyTaxesTitle,
                amount: $scope.defaultTaxSettingData.taxPercentValue,
            }
            $scope.selectTaxTemp(companyId)
        } else {
            var companyId = {
                title: $scope.taxTitleTemp,
                amount: $scope.taxPercentValueTemp,
            }
            $scope.selectTaxTemp(companyId)
        }
    }
    $scope.roundUpAtHundreds = function(n = 0) {
        return Number(Math.round(n * 100) / 100)
    }
    $scope.trimmedData = {
        subtotal: 0,
        taxableSubtotal: 0,
        discount: 0,
        tax: 0,
        total: 0
    }
    $scope.getTrimmedVals = function() {
        // ooj-on-equipment-popup
        // if isNaN
        $scope.bundleSubTotalTemp = isNaN($scope.bundleSubTotalTemp) ? 0 : $scope.bundleSubTotalTemp;
        $scope.taxableSubtotal = isNaN($scope.taxableSubtotal) ? 0 : $scope.taxableSubtotal;
        $scope.discountCalculationTemp = isNaN($scope.discountCalculationTemp) ? 0 : $scope.discountCalculationTemp;
        $scope.taxValueTemp = 0;
        // trimmed
        $scope.trimmedData.subtotal = $rootScope.negativeRoundUp($scope.bundleSubTotalTemp);
        $scope.trimmedData.taxableSubtotal = $rootScope.negativeRoundUp($scope.taxableSubtotal);
        $scope.trimmedData.discount = $scope.roundUpAtHundreds($scope.discountCalculationTemp);
        $scope.trimmedData.tax = 0;
        $scope.trimmedData.total = $rootScope.negativeRoundUp(($scope.trimmedData.subtotal - $scope.trimmedData.discount) + ($scope.trimmedData.tax));
        // reAssign to scope
        $scope.bundleSubTotalTemp = $scope.trimmedData.subtotal;
        $scope.taxableSubtotal = $scope.trimmedData.taxableSubtotal;
        $scope.discountCalculationTemp = $scope.trimmedData.discount;
        $scope.taxValueTemp = 0;
        $scope.bundleTotalTemp = $scope.trimmedData.total;
    }
    $scope.jobActivitySchedulePopup = function() {
        ngDialog.open({
          template: 'jobActivitySchedulePopup.html',
          className: 'ngdialog-theme-default',
          scope: $scope,   
          preCloseCallback: function () {
            $scope.pageObj =  {
                currentPageInv: 1,
                pageInv: '',
                limitInv: 10,
                totalRecordInv: '',
                totalPageInv: ''        
            }
          }       
      });     
    };
    $scope.getCustomerJobAuditLogs = function() {
        $scope.isProcessing = true;
        let jobParam = {
            offset: $scope.pageObj.currentPageInv - 1,
            limit: $scope.pageObj.limitInv,
            sortOrder: $scope.dirInv,
            sortColumn: $scope.columnInv,
            addressId: $scope.addressId,
            jobId: $rootScope.eqTempelateId,
        };
        apiGateWay.get("/get_one_time_job_filter_audit_logs", jobParam).then(function(response) {
            if (response.data.status == 200) {
                $scope.isProcessing = false;                
                let auditLogsResponse = response.data.data;
                $scope.routeAuditLogsList = auditLogsResponse.data;
                // $scope.routeAuditLogsList.forEach(item => {
                //     if(item.message){
                //         item.message = item.message.replace('Activated', '');
                //         item.message = item.message.replace('Deactivated', '');
                //     }
                // })
                $scope.pageObj.totalRecordInv = auditLogsResponse.rows;                
                $scope.pageObj.totalPageInv = $scope.pageObj.totalRecordInv > 0 ? Math.ceil($scope.pageObj.totalRecordInv / $scope.pageObj.limitInv) : 0; 
            } else {
                $scope.isProcessing = false;
            }
        }, function(error){
            $scope.isProcessing = false;
        });
    }

    $scope.goToCustomerListPage = function(page) {
        $scope.pageObj.currentPageInv = page;
        $scope.getCustomerJobAuditLogs();
    };
    
    $scope.cleanHistoryDeleteConfirm = function(cleanHistoryObj, index){
        if(cleanHistoryObj && cleanHistoryObj.deletedBy==0){
        //  $scope.checkListArray.splice(index, 1);
          return
        }
        cleanHistoryObj['deletedBy'] = $scope.currentUser.id;
        $scope.cleanHistoryObj = cleanHistoryObj;
        $scope.index = index;
        ngDialog.open({
            template: 'removeCleanHistoryConfirm.html',
            className: 'ngdialog-theme-default',
            scope: $scope,
            preCloseCallback: function () {
              $scope.cleanHistoryObj = '';
              $scope.index = '';
            }
        });
    }

    $scope.confirmCleanHistoryAction = function(cleanHistoryObj, index){
        $scope.isProcessing = true;
        // ngDialog.closeAll()
        apiGateWay.send("/delete_last_cleaned_date", cleanHistoryObj).then(function(response) {
            if (response.data.status == 200) {
                // $scope.checkListArray.splice(index, 1);
            }
            $rootScope.getEquipmentDetails();
            $scope.isProcessing = false;
        }, function(error){
          $scope.isProcessing = false;
        })
    }
    $scope.getFromattedSaltCleanDate = (v) => {
        let s = '';
        if (v) {
            let dateStrArr = v.split('-');
            let date = Number(dateStrArr[0])
            let month = Number(dateStrArr[1])
            let year = Number(dateStrArr[2])
            date = date < 10 ? '0' + date : '' + date;
            month = month < 10 ? '0' + month : '' + month;
            year = year > 99 ? year.toString().slice(-2) : '' + year;
            s = month + '/' + date + '/' + year;
        }
        return s;
    }
});
