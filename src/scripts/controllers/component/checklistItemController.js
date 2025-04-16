angular.module('POOLAGENCY')

.controller('checklistItemController', function($rootScope, $scope, apiGateWay, ngDialog, service, $state, $stateParams,$timeout, $window, auth, $filter, configConstant, pendingRequests) {
    
    $scope.successMsg = '';
    $scope.error = '';
    $scope.isProcessing = false;
    $scope.checkListFormSubmittting = false;
    $scope.isProcessingWrapper = false;
    $scope.companyId = auth.getSession().companyId
    $scope.addressId = $stateParams.addressId; 
    $scope.jobAddressId = ""; 
    $scope.checkListOneOfJob = true;
    $rootScope.isBlurOn = true;
    $scope.jobAddressId = "";
    if($rootScope.oneJobTemplate){
        $scope.oneJobTemplate = true;
    } else {
        $scope.oneJobTemplate = false;
    }
    $rootScope.payloadCache = '';
    $scope.$on("$destroy", function () {
        $rootScope.payloadCache = '';
    });
    $scope.model = {
        frequencyType:1,
        deleteAfterType:1,
        frequency:null,
        deleteAfter:null,
        endDate:null
    }
    $scope.installDetail = {};
    $scope.activityModel = {
        "galId": 0,
        "saltId": 0,
        "jobId": "",
        "gallanogeCalculated": null,
        "saltSystem": "",
        "addressId": $scope.addressId
    }
    $scope.isOneTimeJobPage = false;
    $scope.isPopupOpen = false;
    $scope.frequencyPopupActive = false;
    $scope.checklistBundle = [];
    $scope.form = {};
    $scope.waterBodies = {};
    $scope.selectedServiceLevelOption = 0;
    $scope.assignedPT = {};
    checklistBundle = "";
    $scope.createChecklistSection = function(checklist){
        $scope.updateCheckListItemHeight()
        $scope.checklistBundle = [
            {type:'whenArriving', title:'When Arriving', sectionId:2, data:[]},
            {type:'jobInProgress', title:'Job In Progress', sectionId:1, data:[]},
            {type:'whenLeaving', title:'When Leaving', sectionId:3, data:[]}
        ];
        angular.forEach(checklist, function(item){
            item.addressId = $scope.addressId;
            item.edit = 0;
            item.editSetting = 0;
            if(!$scope.checkListOneOfJob){
                item.waterBodyId = $scope.waterBodies[$scope.selectedWaterBody];
            } else {
                item.waterBodyId = $scope.waterBodies[$scope.selectedWaterBody].id;
            }
            item.sectionId == 1 ? $scope.checklistBundle[1].data.push(item) : ''; 
            item.sectionId == 2 ? $scope.checklistBundle[0].data.push(item) : ''; 
            item.sectionId == 3 ? $scope.checklistBundle[2].data.push(item) : '';   
            $scope.updateCheckListItemHeight()       
        });
        checklistBundle = $scope.checklistBundle;
        if($scope.checkListOneOfJob){
            $rootScope.eqTempelateId = '';
            $rootScope.templateId = '';
            $scope.getJobSteps()
        }
        setTimeout(function(){
            $scope.updateCheckListItemHeight()
        }, 5)
    }
    $rootScope.getChecklistItemDetail = function(id){
        $scope.shiftNotServicedWaterBodyFirstLand(id);        
        //$scope.assignedSL = $rootScope.assignedSLParent;
        //$scope.serviceLevelArray = $rootScope.serviceLevelArrayParent;
        //$scope.createChecklistSection($rootScope.checkListArrayParent);
        $scope.activityModel = $rootScope.activityModelParent;
        $scope.installDetail = $rootScope.installDetailParent;    
    }    
    $scope.shiftNotServicedWaterBody = function(waterBodiesArray){      
        let sortedArray = waterBodiesArray.sort(function(item1, item2){
            return item2.serviced - item1.serviced;
        })
        $scope.waterBodies = angular.copy(sortedArray);
    }
    $scope.shiftNotServicedWaterBodyFirstLand = function(id){      
        let sortedArray = $rootScope.waterBodiesParent.sort(function(item1, item2){
            return item2.serviced - item1.serviced;
        })
        $scope.waterBodies = angular.copy(sortedArray);
        if(id){
            $scope.waterBodies.filter(function(item, index){
                if(item.id == id){
                    $scope.selectTab(index);
                }            
            })
        } else {
            $scope.selectTab(0);
        }
       
       
    }

    $scope.getChecklistByWaterBodyId = function(id){
        $scope.isProcessing = true;
        apiGateWay.get('/water_body_checklist', {addressId: $scope.addressId, waterBodyId:id}).then(function(response) {
            if(response.data.status == 200){
                $scope.updateCheckListItemHeight()
                $scope.serviceLevelArray = response.data.data.serviceLevel;
                var _sLevelIndex = 0;
                angular.forEach($scope.serviceLevelArray, function(item){
                    $scope.serviceLevelArray[_sLevelIndex].poolType = $scope.serviceLevelArray[_sLevelIndex].poolType || [];
                    $scope.serviceLevelArray[_sLevelIndex].poolType.sort(function(a, b){
                        if(a.poolType.toLowerCase() < b.poolType.toLowerCase()) { return -1; }
                        if(a.poolType.toLowerCase() > b.poolType.toLowerCase()) { return 1; }
                        return 0;
                    })
                    _sLevelIndex++;
                })                
                $scope.assignedSL = response.data.data.assignedSL;
                assignedSL = $scope.assignedSL;
                if(!$scope.assignedSL.serviceLevelId){
                    $scope.assignedSL.serviceLevelId = $scope.assignedSL.id;
                }
                
                let assignedPTTemp =  response.data.data.assignedPL.id;
               
                if($scope.assignedSL.serviceLevelId!= 0){
                    let filterArray = $scope.serviceLevelArray.filter(function(item, index){ 
                        if(item.assigned){ $scope.selectedServiceLevelOption = index; } 
                        if($scope.serviceLevelArray[index].poolType){
                            $scope.serviceLevelArray[index].poolType.unshift({id: 0, poolType: "--", status: 1});
                        } else {
                            $scope.serviceLevelArray[index].poolType = []
                            $scope.serviceLevelArray[index].poolType.push({id: 0, poolType: "--", status: 1});
                        }
                        
                        return item.assigned; 
                    })
                    if(assignedPTTemp != 0){
                        angular.forEach(filterArray[0].poolType, function(item){
                            if(item.id == assignedPTTemp){
                                $scope.assignedPT = angular.copy(item);
                            }                        
                        })
                    } else {
                        $scope.assignedPT = {id: 0, poolType: "--", status: 1}
                    }    

                }
                $scope.createChecklistSection(response.data.data.checkList);
                $scope.updateCheckListItemHeight()
            }  
            $scope.isProcessing = false;
              
          }, function(error){
            $scope.addWaterBodyError = error;
              $scope.isProcessing = false;
              setTimeout(function(){
                $scope.addWaterBodyError = '';                
              }, 2000)
          })
    }
    $scope.getGallonsByWaterBodyId = function(id){   
        apiGateWay.get('/gallonage_detail', {addressId: $scope.addressId, waterBodyId:id}).then(function(response) {
            if(response.data.status == 200){                
                var _gallonageRes = response.data.data.gallonage;
                var gallonage = ''               
                if (_gallonageRes && _gallonageRes != '' && _gallonageRes != null && _gallonageRes != undefined) {
                    gallonage = Number(_gallonageRes)
                    gallonage = String(gallonage)
                }
                $scope.installDetail.gallonage = gallonage
                $scope.activityModel.gallanogeCalculated = gallonage;
                $rootScope.gallanoges = gallonage;
            }
        })
    }
    /*Tab setting Start*/
 
    /*Water Bodies Add/Edit Start*/
    $scope.waterBodiesModel = {};

    $scope.openAddWaterBodiesPopup = function(index){
        $scope.waterBodiesModel = {            
            "addressId": $scope.addressId, 
            "allowDelete": 1, 
            "color": "#FF6624", 
            "id": '', 
            "jobId": "",
            "notes": "", 
            "serviced": 1, 
            "typeId": '', 
            "waterBodyName": '',
            'status':1,
            'servicedCheckbox':false
        }
        if(index || index === 0){
          $scope.waterBodiesModel = angular.copy($scope.waterBodies[index]);
          $scope.waterBodiesModel.servicedCheckbox = $scope.waterBodies[index].serviced ? false : true;
        }
        $scope.index = index;
        ngDialog.open({
          id  : 10,
          template: 'addWaterBodiesPopup.html',
          className: 'ngdialog-theme-default v-center',
          overlay: true,
          closeByNavigation: true,
          scope: $scope,
          preCloseCallback: function() {     
              $scope.waterBodiesModel = {};    
              $scope.index = '';
              $scope.colorPickerMask = false;
          }
      });
       
    }
    $scope.chooseWaterBodyType = function(obj){
        $scope.waterBodiesModel.color = obj.defaultColor;
        $scope.waterBodiesModel.waterBodyName =  $scope.waterBodyNameSuggestion(obj);
    }
    $scope.waterBodyNameSuggestion = function(obj){      
        var suggestion = [
            [],
            ['Pool'],
            ['Spa'],
            ['Fountain'],
            ['Other']
        ]
       
        if([1,2,3,4].indexOf(parseInt(obj.typeId)) > -1){         
            count = 1;
            for(var i = 0; i <= $scope.waterBodies.length-1;i++){
                if($scope.waterBodies[i].typeId == obj.typeId){
                    count++;
                    suggestion[obj.typeId].push(suggestion[obj.typeId][0]+' '+ count);
                }
            }
            var finalArray = suggestion[obj.typeId].filter(function(item){
                var isMatch = $scope.waterBodies.filter(function(data){
                    return item == data.waterBodyName;
                })
                if(isMatch.length > 0){  
                    if(!$scope.waterBodiesModel.id){ 
                        return isMatch[0].waterBodyName != item; 
                    } else {
                        if(isMatch[0].waterBodyName != $scope.waterBodies[$scope.selectedWaterBody].waterBodyName){ 
                            return isMatch[0].waterBodyName != item; 
                        } else {
                            return item; 
                        }
                    }                
                } else {
                    return item;
                }
            })
            return finalArray[0];
        } else {
            return '';
        }  
    }
    $scope.addNewWaterBody = function(model){ 
        $rootScope.defaultServiceLevelDataFetched = false;
        $rootScope.getDefaultServiceLevelData();  
        var postData = model;   
        $scope.isProcessingWrapper = true;
        postData.addressId = $scope.addressId;
       if(model.servicedCheckbox){
            postData.serviced = 0;
            model.serviced = 0;
       } else {
            postData.serviced = 1;
            model.serviced = 1;
       }
       var shift = false;
       if($scope.waterBodies[$scope.index] && $scope.waterBodies[$scope.index].serviced != postData.serviced && postData.serviced == 0){
        shift = true;
       }
       var creatingNewWB = postData.id == '';
       let serviceLevelData = {
            id: $rootScope.defaultServiceLevelData.id,
            addressId: postData.addressId,
            waterBodyId: 0,
            serviceLevelCheck: 1
       };
        //{"waterBodyName": "Spa 1", "color": "#fff", "typeId": "2", "addressId":"61277524" }
        apiGateWay.send('/water_body', postData).then(function(response) {
          if(response.data.status == 201){ 
            if(($scope.index || $scope.index==0) && $scope.waterBodies[$scope.index].id ){
                $scope.waterBodies[$scope.index] = angular.copy($scope.waterBodiesModel);
                $scope.updateTabScroll();   
                if(shift){
                    $scope.shiftNotServicedWaterBody($scope.waterBodies)
                    $scope.selectTab(0, true);
                    $scope.updateCheckListItemHeight()
                } else {
                    $scope.selectTab($scope.index, true);
                    $scope.updateCheckListItemHeight()
                }                              
                //$scope.shiftNotServicedWaterBody($scope.waterBodies)
            } else {
                $scope.waterBodiesModel.id = response.data.data.waterBodyId;
                $scope.waterBodies.push(angular.copy($scope.waterBodiesModel));
                $scope.shiftNotServicedWaterBody($scope.waterBodies);
                $scope.updateTabScroll(); 
                $scope.updateCheckListItemHeight()
                var findAddIndex = $scope.waterBodies.findIndex(x => x.id === $scope.waterBodiesModel.id);          
                var selectIndex = findAddIndex > -1 ? findAddIndex : 0;      
                $scope.selectTab(selectIndex);                
                if (creatingNewWB) {
                    serviceLevelData.waterBodyId = response.data.data.waterBodyId;
                    var findIndexOfDefaultWB = $scope.serviceLevelArray.findIndex(x => x.id === $rootScope.defaultServiceLevelData.id)                    
                    if (findIndexOfDefaultWB > -1) {
                        $scope.assignServiceLevel($rootScope.defaultServiceLevelData.id, $rootScope.defaultServiceLevelData.title, findIndexOfDefaultWB, 1);                    
                    }
                }             
            }    
            $scope.isProcessingWrapper = false;           
            $scope.addWaterBodySuccess = '';
            $scope.addWaterBodyError = '';   
            ngDialog.closeAll();             
            if (!$scope.$$phase) $scope.$apply();                   
              
          } else {
            $scope.addWaterBodyError = response.data.message;    
            setTimeout(function(){   
                $scope.addWaterBodySuccess = '';
                $scope.addWaterBodyError = '';   
                if (!$scope.$$phase) $scope.$apply();                        
            }, 1500);           
           
          }                
          
          $scope.isProcessingWrapper = false;
            
        }, function(error){
          $scope.addWaterBodyError = error;
          $scope.isProcessingWrapper = false;
            setTimeout(function(){
              $scope.addWaterBodyError = '';
              
            }, 2000)
        })
    }
    $scope.waterBodyDeleteConfirm = function(){        
       
        ngDialog.open({
            template: 'removeWaterBodyConfirm.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function () {               
            }
        });
      }
    $scope.deleteWaterBody = function(){   
        var postData = angular.copy($scope.waterBodies[$scope.index]); 
        postData.status = 0;       
        apiGateWay.send('/water_body', postData).then(function(response) {
          if(response.data.status == 201){     
            $scope.waterBodies.splice($scope.index, 1); 
            $scope.selectTab(0);     
            $scope.updateTabScroll();  
            $scope.updateCheckListItemHeight()          
            ngDialog.closeAll();
            setTimeout(function(){   
                $scope.updateTabScroll();         
                $scope.updateCheckListItemHeight()   
                ngDialog.closeAll();  
                if (!$scope.$$phase) $scope.$apply();                        
            }, 500);      
                      
                
          } else {
            $scope.addWaterBodyError = response.data.message;    
            setTimeout(function(){   
                $scope.addWaterBodySuccess = '';
                $scope.addWaterBodyError = '';   
                if (!$scope.$$phase) $scope.$apply();                        
            }, 1500);           
           
          }    
            
        }, function(error){
          $scope.addWaterBodyError = error;
            $scope.isProcessing = false;
            setTimeout(function(){
              $scope.addWaterBodyError = '';
              
            }, 2000)
        })
    }
    $scope.colorPickerMask = false;
    $scope.toggleColorClickArea = function(){
        $scope.colorPickerMask = !$scope.colorPickerMask;
    }
    /*Water Bodies Add/Edit End*/
    $scope.selectedWaterBody = '';
    $scope.scrollWaterBodiesTab = function (direction){
        var speed=25,distance=100,step=10;
        var element = document.querySelectorAll('.water-bodies-tab')[0];
        var scrollAmount = 0;
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
        $scope.updateCheckListItemHeight()
    }
    var tabUpdateIntervalIns = '';  
        $scope.updateTabScroll = function(){
        $scope.updateCheckListItemHeight()     
        tabUpdateIntervalIns = setTimeout(function(){ 
            $scope.tabContainerWidth = 0;
            var ele = document.querySelectorAll('#waterBodiesTab')[0];
            for (var i = 0; i < angular.element(ele).children().length; i++) {
            $scope.tabContainerWidth += angular.element(ele).children()[i].clientWidth;
            }
            $scope.tabContainerWidth += 1;   
            $scope.$apply();
            $scope.updateCheckListItemHeight()     
        }, 100)     
    }
    
    $scope.clearTabUpdateInterval = function(){
        if(tabUpdateIntervalIns){clearTimeout(tabUpdateIntervalIns);}
    }
    $rootScope.refreshWBSection = () => {
        if($scope.selectedWaterBody){
            $scope.selectTab($scope.selectedWaterBody, true);
        }
    }
    $scope.selectTab = function(tabIndex, force=false){
        if($scope.selectedWaterBody !== tabIndex || force){
            $scope.selectedWaterBody = tabIndex;
            $scope.updateTabScroll(); 
            $scope.getChecklistByWaterBodyId($scope.waterBodies[tabIndex].id);
            $scope.getGallonsByWaterBodyId($scope.waterBodies[tabIndex].id)
            if (angular.isDefined($rootScope.getEquipmentDetails) && angular.isFunction($rootScope.getEquipmentDetails)) {$rootScope.getEquipmentDetails($scope.waterBodies[tabIndex]);}            
            if (angular.isDefined($rootScope.getJobDetailByWaterBody) && angular.isFunction($rootScope.getJobDetailByWaterBody)) {$rootScope.getJobDetailByWaterBody($scope.waterBodies[tabIndex]);}
        }       
    }
    /*Tab setting End*/
    $scope.assignServiceLevel = function(id, title, index, serviceLevelCheck = 0){  
        $scope.isProcessing = true;    
        if (title==='--') {
            serviceLevelCheck = 1 
        }    
        var serviceLevelData = {serviceLevelCheck:serviceLevelCheck, id:id, addressId:$scope.addressId, waterBodyId: $scope.waterBodies[$scope.selectedWaterBody].id,billing_schedule_name: $scope.waterBodies[$scope.selectedWaterBody].waterBodyName, billing_schedule_service_level: title,actionPerformed: $rootScope.actionPerformed};
        apiGateWay.send("/assign_servicelevel", serviceLevelData).then(function(response) {
            if (response.data.status == 200) {
                $rootScope.actionPerformed = '';
                $scope.assignedSL.serviceLevelId = id;
                if (serviceLevelCheck == 1) { 
                    $scope.assignedSL.title = '--';
                } else {
                    $scope.assignedSL.title = title;
                }
                $scope.selectedServiceLevelOption = index;
                $scope.successMsg = response.data.message;
                $scope.createChecklistSection(response.data.data.checkList);
                $scope.assignedPT = {id:0, poolType:'--', status:1}
                

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

    $scope.assignPoolType = function(id, title, index){
        $scope.isProcessing = true;
        let postData = {"poolTypeId":id, serviceLevelId: $scope.assignedSL.serviceLevelId, addressId:$scope.addressId, waterBodyId: $scope.waterBodies[$scope.selectedWaterBody].id,billing_schedule_type: title, billing_schedule_name: $scope.waterBodies[$scope.selectedWaterBody].waterBodyName,actionPerformed: $rootScope.actionPerformed};
        apiGateWay.send("/assign_pool_type", postData).then(function(response) {
            if (response.data.status == 200) {
                $rootScope.actionPerformed = '';
                $scope.assignedPT.id = id;
                $scope.assignedPT.poolType = title;
                $scope.assignedPT.status = 1;
                $scope.successMsg = response.data.message;
                //$scope.createChecklistSection(response.data.data.checkList);
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
    $scope.intervalIns = '';
    $scope.saveCheckListTrigger = function(parentIndex, index, reqActions){
        $scope.frequencyPopupActive = false;
        $scope.focusedchecklistBundleCache = angular.copy($scope.checklistBundle);
        $scope.changed_checklist_index = index;
        if(reqActions){
            if($scope.checklistBundle[parentIndex].data[index].title == ''){
                $scope.changed_checklist_action = '';   
            }
            else {
                    $scope.dragNDropElementId = $scope.checklistBundle[parentIndex].data[index].id;
                    if(reqActions == 'required'){
                        $scope.changed_checklist_is_required = 'field';
                        $scope.changed_checklist_action = $scope.checklistBundle[parentIndex].data[index].required ? 'required' : 'optional';
                        $scope.changed_checklist_index = index;
                    }
                    else{
                        $scope.changed_checklist_is_required = 'photo';
                        $scope.changed_checklist_action = $scope.checklistBundle[parentIndex].data[index].photo == "1" ? 'required' : 'optional';
                        $scope.changed_checklist_index = index;
                    }
            }
        }
        else{
            $scope.changed_checklist_action = "";
            if($scope.checklistBundle[parentIndex].data[index].id == 0 && $scope.checklistBundle[parentIndex].data[index].title != ""){
                $scope.changed_checklist_action = "add";
            }
            else{
                if($scope.checklistBundle[parentIndex].data[index].title != ""){
                    $scope.dragNDropElementId = $scope.checklistBundle[parentIndex].data[index].id;
                    $scope.changed_checklist_action = "update"; 
                }
            }
        }
        $scope.checklistBundle[parentIndex].data[index].edit = 1;
        $scope.clearSaveInterval();
        // $scope.checkListFormSubmittting = true;
        // $scope.intervalIns = $timeout(function() {document.getElementById('checklistSubmit').click();}, 500)
    }
    
    $scope.clearSaveInterval = function(){
        if ($scope.intervalIns) {
            $timeout.cancel($scope.intervalIns);
        }
    }

    $scope.saveFrequencyTrigger = function(){      
        $scope.frequencyPopupActive = true;  
        $timeout(function() {document.getElementById('checklistSubmit').click();}, 100)
      
    }
    
    $scope.enableChecklist = true;
    $rootScope.saveCheckList = function(jobTemplateId){
        $scope.checkListFormSubmittting = true;
        $scope.successMsg = false;
        $scope.frequencySuccessMsg = false;
        $scope.enableChecklist = false;
        $scope.clearSaveInterval(); 
        var date  = $scope.model.endDate ? angular.copy(new Date( $scope.model.endDate+' 12:00:00')) : '';
        if($scope.frequencyPopupActive){
            $scope.checklistBundle[$scope.parentIndex].data[$scope.index].editSetting = 1;     
            $scope.checklistBundle[$scope.parentIndex].data[$scope.index].frequency = ($scope.model.frequencyType == 1 ? 0 : $scope.model.frequency); 
            $scope.tempFrequency = ($scope.model.frequencyType == 1 ? '' : $scope.model.frequency); 
            $scope.checklistBundle[$scope.parentIndex].data[$scope.index].deleteAfter = ($scope.model.endDate && $scope.model.deleteAfterType == 3 ? 
                0 : $scope.model.deleteAfter && $scope.model.deleteAfterType == 2 ? 
                $scope.model.deleteAfter : 0);
            $scope.tempDeleteAfter =  ($scope.model.endDate && $scope.model.deleteAfterType == 3 ? 
                '' : $scope.model.deleteAfter && $scope.model.deleteAfterType == 2 ? 
                $scope.model.deleteAfter : '');   
            $scope.checklistBundle[$scope.parentIndex].data[$scope.index].endDate = $scope.model.deleteAfterType == 3 ? moment.utc(date).format('YYYY-MM-DD hh:mm:ss') : null;  
            if(!$scope.model.endDate && !$scope.model.deleteAfter && $scope.model.deleteAfterType == 2){            
                return false;
            }
            if(!$scope.model.frequency && $scope.model.frequencyType == 2){     
                return false;
            }
        }

        var postData = [];
        if ($scope.focusedchecklistBundleCache) {
            angular.forEach($scope.checklistBundle, function(item){
                angular.forEach(item.data, function(item2){
                    item2.addressId = $scope.addressId;
                });
            });
            $scope.focusedchecklistBundleCache[1].data = $scope.checklistBundle[1].data;
            $scope.focusedchecklistBundleCache[0].data = $scope.checklistBundle[0].data;
            $scope.focusedchecklistBundleCache[2].data = $scope.checklistBundle[2].data
            postData = angular.copy(postData).concat($scope.focusedchecklistBundleCache[1].data);
            postData = angular.copy(postData).concat($scope.focusedchecklistBundleCache[0].data);
            postData = angular.copy(postData).concat($scope.focusedchecklistBundleCache[2].data);
        } else {
            angular.forEach($scope.checklistBundle, function(item){
                angular.forEach(item.data, function(item2){
                    item2.addressId = $scope.addressId;
                });
            });
            postData = angular.copy(postData).concat($scope.checklistBundle[1].data);
            postData = angular.copy(postData).concat($scope.checklistBundle[0].data);
            postData = angular.copy(postData).concat($scope.checklistBundle[2].data);
        }     
        postData.forEach(function(item,index){
            if($scope.dragNDropElementId){
                if($scope.dragNDropElementId == item.id){
                    $rootScope.actionPerformed = "changed_checklist";
                    $scope.changed_checklist_index = index;
                }
            }
        });
        var titleisDefined = true;
        angular.forEach(postData, function(element, index){
        if(!element.title) {
            titleisDefined = false;
        }
        });
        angular.forEach(postData, function(data, index){
            postData[index].oneOfJobId = $rootScope.templateId ? $rootScope.templateId : $scope.jobId;
            if($rootScope.templateId || $scope.eqTempelateId){ 
                postData[index].oneOfJobId = $rootScope.templateId ? $rootScope.templateId : $scope.eqTempelateId;
                postData[index].isTemplate = 1;
            }else{
                postData[index].oneOfJobId = $scope.jobId;
                postData[index].isTemplate = 0;
            } 
        })
        obj = { 
            actionPerformed: $rootScope.actionPerformed,
            changed_checklist_index: $scope.changed_checklist_index,
            changed_checklist_action: $scope.changed_checklist_action,
            changed_checklist_is_required: $scope.changed_checklist_is_required,
            postData: postData
        }
        if (titleisDefined) {
            if($rootScope.isBlurOn){ 
                $scope.error = '';
                $rootScope.errorChecklist = '';
                let payLoadString = '';
                try {
                    payLoadString = JSON.stringify(obj);
                } catch (error) {
                    payLoadString = '';
                }
                if ($rootScope.payloadCache != '' && $rootScope.payloadCache == payLoadString) {
                    return
                }
                $rootScope.payloadCache = payLoadString;
                $scope.$parent.apiProcessing.one_job_check_list = true;
                apiGateWay.send("/one_job_check_list", obj).then(function(response) {
                    $scope.$parent.apiProcessing.one_job_check_list = false;
                    $scope.clearSaveInterval(); 
                    $scope.checkListFormSubmittting = false;
                    $scope.editTemplate = true;
                    var responseData = response.data;
                    if(Object.keys(responseData.data).length > 0){
                        angular.forEach($scope.checklistBundle, function(bundle, parentIndex){
                            angular.forEach($scope.checklistBundle[parentIndex].data, function(element, index){
                                $scope.checklistBundle[parentIndex].data[index].edit = 0;
                                if(element && element.randomId && responseData.data[element.randomId]){
                                    $scope.checklistBundle[parentIndex].data[index].id = responseData.data[element.randomId]
                                }
                            })
                        })
                    } else {
                        angular.forEach($scope.checklistBundle, function(bundle, parentIndex){
                            angular.forEach($scope.checklistBundle[parentIndex].data, function(element, index){
                                $scope.checklistBundle[parentIndex].data[index].edit = 0;                       
                            })
                        })
                    }
                }, function(error){
                    $scope.$parent.apiProcessing.one_job_check_list = false;
                });
            }                    
        }
        $scope.enableChecklist = true;
    }

    var filterTextTimeout;
    $scope.enableChecklist = true;
    $rootScope.saveCheckListItem = function(parentArray, item, name, isReorder = false, index = 0, isDropdownSaving=false){
        $scope.successMsg = '';
        $scope.error = '';
        $scope.checkListFormSubmittting = true;
        $scope.successMsg = false;
        $scope.frequencySuccessMsg = false;
        $scope.enableChecklist = false;
        $scope.clearSaveInterval(); 
        var date  = $scope.model.endDate ? angular.copy(new Date( $scope.model.endDate+' 12:00:00')) : '';
        if($scope.frequencyPopupActive){
            if($scope.specificIndex == null){
                $scope.checklistBundle[$scope.parentIndex].data[$scope.index].days = "";
            }
            $scope.checklistBundle[$scope.parentIndex].data[$scope.index].editSetting = 1;     
            $scope.checklistBundle[$scope.parentIndex].data[$scope.index].frequency = ($scope.model.frequencyType == 1 ? 0 : $scope.model.frequency); 
            $scope.tempFrequency = ($scope.model.frequencyType == 1 ? '' : $scope.model.frequency); 
            $scope.checklistBundle[$scope.parentIndex].data[$scope.index].deleteAfter = ($scope.model.endDate && $scope.model.deleteAfterType == 3 ? 
                0 : $scope.model.deleteAfter && $scope.model.deleteAfterType == 2 ? 
                $scope.model.deleteAfter : 0);
            $scope.tempDeleteAfter =  ($scope.model.endDate && $scope.model.deleteAfterType == 3 ? 
                '' : $scope.model.deleteAfter && $scope.model.deleteAfterType == 2 ? 
                $scope.model.deleteAfter : '');   
            $scope.checklistBundle[$scope.parentIndex].data[$scope.index].endDate = $scope.model.deleteAfterType == 3 ? moment.utc(date).format('YYYY-MM-DD hh:mm:ss') : null;  
            if(!$scope.model.endDate && !$scope.model.deleteAfter && $scope.model.deleteAfterType == 2){            
                return false;
            }
            if(!$scope.model.frequency && $scope.model.frequencyType == 2){     
                return false;
            }
            if(!$scope.model.frequency && $scope.model.frequencyType == 3 && $scope.specificDays == undefined){     
                return false;
            }
        }

        var postData = [];
        if ($scope.focusedchecklistBundleCache) {
            angular.forEach($scope.checklistBundle, function(item){
                angular.forEach(item.data, function(item2){
                    item2.addressId = $scope.addressId;
                });
            });
            $scope.focusedchecklistBundleCache[1].data = checklistBundle.length > 0 ? checklistBundle[1].data : $scope.checklistBundle[1].data;
            $scope.focusedchecklistBundleCache[0].data = checklistBundle.length > 0 ? checklistBundle[0].data : $scope.checklistBundle[0].data;
            $scope.focusedchecklistBundleCache[2].data = checklistBundle.length > 0 ? checklistBundle[2].data : $scope.checklistBundle[2].data;
            postData = angular.copy(postData).concat($scope.focusedchecklistBundleCache[1].data);
            postData = angular.copy(postData).concat($scope.focusedchecklistBundleCache[0].data);
            postData = angular.copy(postData).concat($scope.focusedchecklistBundleCache[2].data);
        } else {
            angular.forEach($scope.checklistBundle, function(item){
                angular.forEach(item.data, function(item2){
                    item2.addressId = $scope.addressId;
                });
            });
            postData = angular.copy(postData).concat(checklistBundle.length > 0 ? checklistBundle[1].data : $scope.checklistBundle[1].data);
            postData = angular.copy(postData).concat(checklistBundle.length > 0 ? checklistBundle[0].data : $scope.checklistBundle[0].data);
            postData = angular.copy(postData).concat(checklistBundle.length > 0 ? checklistBundle[2].data : $scope.checklistBundle[2].data);
        }     
        postData.forEach(function(item,index){
            if($scope.dragNDropElementId){
                if($scope.dragNDropElementId == item.id){
                    $rootScope.actionPerformed = "changed_checklist";
                    $scope.changed_checklist_index = index;
                }
            }
        })
        // let _checkListArr = postData;    
        // if ($scope.isDuplicate(_checkListArr)) {
        //   $scope.successMsg = '';
        //   $scope.successChecklist = '';
        //   $scope.error = 'This checklist item name already exists';
        //   $scope.enableChecklist = true;
        //   if(item.id == 0){
        //       var targetValue = item.title;
        //         var deleted = false;    
        //         parentArray.forEach(function(obj, index) {
        //         if (obj.title === targetValue && !deleted) {
        //             parentArray.splice(index, 1);
        //             deleted = true;
        //         }
        //         return;
        //         });
        //   }
        //   else{
        //     $scope.getChecklistByWaterBodyId(item.waterBodyId);
        //   }
        //   $rootScope.errorChecklist = '';
        //   setTimeout(function(){
        //           $scope.error = false;
        //       }, 500)
        //   return
        // }
        // var titleisDefined = true;
        // postData = postData.filter(obj => obj.title !== "");
        angular.forEach(postData, function(data, index){
            postData[index].oneOfJobId = $rootScope.templateId ? $rootScope.templateId : $scope.jobId;
            if($rootScope.templateId || $scope.eqTempelateId){ 
                postData[index].oneOfJobId = $rootScope.templateId ? $rootScope.templateId : $scope.eqTempelateId;
                postData[index].isTemplate = 1;
            }else{
                postData[index].oneOfJobId = $scope.jobId;
                postData[index].isTemplate = 0;
            }
        });
        if (!$scope.checkListOneOfJob) {
            if ($rootScope.isBlurOn) {
                let endpoint = '/one_job_check_list';
                $scope.error = '';
                $rootScope.errorChecklist = '';
                let delayApi = 10; 
                angular.forEach(postData, function(data, index){
                    if(postData[index].id == 0){
                        delayApi = 3000; 
                    }
                });
                if (isDropdownSaving) {
                    delayApi = 0
                }
                if (filterTextTimeout) $timeout.cancel(filterTextTimeout);
                filterTextTimeout = $timeout(function () {
                    var postData = [];
                    if ($scope.focusedchecklistBundleCache) {
                        angular.forEach($scope.checklistBundle, function(item){
                            angular.forEach(item.data, function(item2){
                                item2.addressId = $scope.addressId;
                            });
                        });
                        $scope.focusedchecklistBundleCache[1].data = checklistBundle.length > 0 ? checklistBundle[1].data : $scope.checklistBundle[1].data;
                        $scope.focusedchecklistBundleCache[0].data = checklistBundle.length > 0 ? checklistBundle[0].data : $scope.checklistBundle[0].data;
                        $scope.focusedchecklistBundleCache[2].data = checklistBundle.length > 0 ? checklistBundle[2].data : $scope.checklistBundle[2].data;
                        postData = angular.copy(postData).concat($scope.focusedchecklistBundleCache[1].data);
                        postData = angular.copy(postData).concat($scope.focusedchecklistBundleCache[0].data);
                        postData = angular.copy(postData).concat($scope.focusedchecklistBundleCache[2].data);
                    } else {
                        angular.forEach($scope.checklistBundle, function(item){
                            angular.forEach(item.data, function(item2){
                                item2.addressId = $scope.addressId;
                            });
                        });
                        postData = angular.copy(postData).concat(checklistBundle.length > 0 ? checklistBundle[1].data : $scope.checklistBundle[1].data);
                        postData = angular.copy(postData).concat(checklistBundle.length > 0 ? checklistBundle[0].data : $scope.checklistBundle[0].data);
                        postData = angular.copy(postData).concat(checklistBundle.length > 0 ? checklistBundle[2].data : $scope.checklistBundle[2].data);
                    } 
                    angular.forEach(postData, function(data, index){
                        postData[index].oneOfJobId = $rootScope.templateId ? $rootScope.templateId : $scope.jobId;
                        if($rootScope.templateId || $scope.eqTempelateId){ 
                            postData[index].oneOfJobId = $rootScope.templateId ? $rootScope.templateId : $scope.eqTempelateId;
                            postData[index].isTemplate = 1;
                        }else{
                            postData[index].oneOfJobId = $scope.jobId;
                            postData[index].isTemplate = 0;
                        } 
                    });
                    obj = { 
                        actionPerformed: $rootScope.actionPerformed,
                        changed_checklist_index: $scope.changed_checklist_index,
                        changed_checklist_action: $scope.changed_checklist_action,
                        changed_checklist_is_required: $scope.changed_checklist_is_required,
                        postData: postData
                    }
                    let payLoadString = '';
                    try {
                        payLoadString = JSON.stringify(obj);
                    } catch (error) {
                        payLoadString = '';
                    }
                    if ($rootScope.payloadCache != '' && $rootScope.payloadCache == payLoadString) {
                        $scope.checkListFormSubmittting = false;
                        if ($scope.dropDownMenuSettingsPopup && isDropdownSaving) {
                            $scope.dropDownMenuSettingsPopup.close();
                        }   
                        return
                    }
                    $rootScope.payloadCache = payLoadString;
                    apiGateWay.send(endpoint, obj).then(function (response) {
                        $scope.checkListFormSubmittting = false;
                        $scope.editTemplate = true;
                        var responseData = response.data;
                        if (Object.keys(responseData.data).length > 0) {
                            angular.forEach($scope.checklistBundle, function (bundle, parentIndex) {
                                angular.forEach($scope.checklistBundle[parentIndex].data, function (element, index) {
                                    $scope.checklistBundle[parentIndex].data[index].edit = 0;
                                    if (element && element.randomId && responseData.data[element.randomId]) {
                                        $scope.checklistBundle[parentIndex].data[index].id = responseData.data[element.randomId];
                                    }
                                })
                            })
                        } else {
                            angular.forEach($scope.checklistBundle, function (bundle, parentIndex) {
                                angular.forEach($scope.checklistBundle[parentIndex].data, function (element, index) {
                                    $scope.checklistBundle[parentIndex].data[index].edit = 0;
                                })
                            })
                        }

                        $scope.successMsg = "Checklist saved successfully.";       
                        if ($scope.dropDownMenuSettingsPopup && isDropdownSaving) {
                            $scope.dropDownMenuSettingsPopup.close();
                        }                
                        setTimeout(function () {
                            if (!$scope.isPopupOpen) {
                                $scope.index = ''
                                $scope.parentIndex = ''
                            }
                            $scope.frequencyPopupActive = false;
                            $scope.successMsg = false;
                            $scope.frequencySuccessMsg = false;
                        }, 500)
                        $scope.isProcessing = false;
                        $scope.dropdownSavingLoader = false;
                        $scope.error = '';
                        $rootScope.errorChecklist = '';
                    }, function (errorResponse) {
                        $scope.checkListFormSubmittting = false;
                        if ($scope.dropDownMenuSettingsPopup) {
                            $scope.showDropDownMenuError(errorResponse)
                            $scope.isProcessing = false;
                            $scope.dropdownSavingLoader = false;
                            return
                        }  
                        if (errorResponse !== 'Something went wrong. Please try again.') {
                            $scope.error = '';
                            $rootScope.errorChecklist = '';
                        }
                        if (errorResponse == 'This checklist item name already exists') {
                            $scope.error = 'This checklist item name already exists';
                            $scope.errorResponse = 'This checklist item name already exists';
                            $scope.getChecklistOneOfJob();
                        }
                        setTimeout(function () {
                            $scope.error = '';
                            $scope.errorResponse = false;
                            $rootScope.errorChecklist = '';
                        }, 2000);
                        $scope.isProcessing = false;
                        $scope.dropdownSavingLoader = false;
                    });
                },delayApi); // delay 500 ms
            }
        } else {
            if (postData && postData.length > 0) {
                postData.forEach(function (item) {
                    item.serviceLevelId = $rootScope.defaultServiceLevelData.id;
                    item.showInApp = item.showInApp ? item.showInApp : 1;
                })
            }
            let delayApi = 0;
            if (item.id == 0) {
                delayApi = 2000;
            }
            if (isDropdownSaving) {
                delayApi = 0
            }
            var lastAPIHit = true;
            if (filterTextTimeout) $timeout.cancel(filterTextTimeout);
            filterTextTimeout = $timeout(function () {
                    if (lastAPIHit) {
                        lastAPIHit = false;
                        let endpoint = '/company/address_check_list';
                        var postDataNew = {};
                        postDataNew.serviceLevelId = $scope.assignedSL ? $scope.assignedSL.serviceLevelId : assignedSL.serviceLevelId;
                        var postItemId = postDataNew.postData && postDataNew.postData.id ? postDataNew.postData.id : 0;
                        if (!isReorder) {
                            postDataNew.postData = {
                                id: item.id
                            };
                            postDataNew.postData[name] = item[name];
                            postDataNew.postData = item;
                            if (postDataNew.postData.id == 0) {
                                postDataNew.updateAction = "increment";
                            }
                            else {
                                postDataNew.updateAction = name;
                                if (name == 'frequency') {
                                    postDataNew.postData.frequency = ($scope.model.frequencyType == 1) ? 0 : ($scope.model.frequencyType == 2 && $scope.model.frequency > 0) ? $scope.model.frequency : 0;
                                    postDataNew.postData.days = ($scope.model.frequencyType == 1 || $scope.model.frequencyType == 2) ? null : $scope.specificDays;
                                }
                            }

                            if (!postDataNew.postData.title) {
                                return false;
                            }
                        }
                        // re-ordered custom data
                        var reOrderedData = [];
                        if (isReorder) {
                            angular.forEach(postData, function (element, index) {
                                reOrderedData.push({
                                    id: element.id,
                                    ordering: index + 1,
                                    sectionId: element.sectionId,
                                });
                            });
                            const desiredObject = postData.find(obj => obj.title == '');
                            if (desiredObject) {
                                return false;
                            }
                            var reOrderForNewItem = postData.find(obj => obj.id == 0);
                            if (reOrderForNewItem) {
                                postDataNew.postData = reOrderForNewItem;
                                postDataNew.updateAction = "increment";
                            }
                            else {
                                postDataNew.postData = reOrderedData;
                                postDataNew.updateAction = "ordering";
                            }
                        }
                        if (name == 'days') {
                            angular.forEach(postData, function (data) {
                                if (data.id === $scope.checkListObj.id) {
                                    postDataNew.postData = data;
                                    postDataNew.postData.days = $scope.specificDays;
                                    postDataNew.postData.frequency = 0;
                                    postDataNew.postData.counter = 0;
                                    postDataNew.updateAction = name;
                                }
                            });
                        }
                        apiGateWay.send(endpoint, postDataNew).then(function (response) {
                            $scope.enableChecklist = true;
                            $scope.checkListFormSubmittting = false;
                            var responseData = response.data;
                            if (Object.keys(responseData.data).length > 0) {
                                if (responseData.data.updateData && responseData.data.updateData.checkListId) {
                                    item.id = responseData.data.updateData.checkListId;
                                }
                                angular.forEach($scope.checklistBundle, function (bundle, parentIndex) {
                                    angular.forEach($scope.checklistBundle[parentIndex].data, function (element, index) {
                                        $scope.checklistBundle[parentIndex].data[index].edit = 0;
                                        // $scope.checklistBundle[parentIndex].data[index].days = postDataNew.postData.days;

                                        if (element && element.id && element.id == postItemId) {
                                            bundleListIndex = parentIndex;
                                        }
                                    })
                                });
                                $scope.updateCheckListItemHeight();
                            } else {
                                angular.forEach($scope.checklistBundle, function (bundle, parentIndex) {
                                    angular.forEach($scope.checklistBundle[parentIndex].data, function (element, index) {
                                        $scope.checklistBundle[parentIndex].data[index].edit = 0;
                                    })
                                })
                            }
                            if ($scope.frequencyPopupActive) {
                                $scope.checklistBundle[$scope.parentIndex].data[$scope.index].editSetting = 0;
                                $scope.frequencySuccessMsg = "Frequency saved successfully.";
                            } else {
                                if (responseData.message == 'This checklist item name already exists') {
                                    if ($scope.dropDownMenuSettingsPopup) {
                                        $scope.showDropDownMenuError(responseData.message)
                                        $scope.isProcessing = false;
                                        $scope.dropdownSavingLoader = false;
                                        return
                                    }  
                                    $scope.error = responseData.message;
                                    $rootScope.errorChecklist = responseData.message;
                                    $scope.successMsg = '';
                                    $rootScope.successChecklist = '';
                                    setTimeout(function () {
                                        $scope.error = false;
                                        $rootScope.errorChecklist = '';
                                    }, 2000);
                                    $scope.getChecklistByWaterBodyId(postDataNew.postData.waterBodyId);
                                    if (postDataNew.postData.id == 0 || reOrderForNewItem) {
                                        var targetValue = postDataNew.postData.title;
                                        var deleted = false;
                                        parentArray.forEach(function (obj, index) {
                                            if (obj.title === targetValue && !deleted) {
                                                parentArray.splice(index, 1);
                                                deleted = true;
                                            }
                                            return;
                                        });
                                    }
                                    else {
                                        item.title = responseData.data.title;
                                    }
                                }
                                else {
                                    $scope.successMsg = "Checklist saved successfully.";
                                    $rootScope.successChecklist = "Checklist saved successfully."
                                    $scope.error = false;
                                    $rootScope.errorChecklist = '';
                                    if ($scope.dropDownMenuSettingsPopup && isDropdownSaving) {
                                        $scope.selectTab($scope.selectedWaterBody, true);
                                        $scope.dropDownMenuSettingsPopup.close();
                                    }
                                }
                            }
                            setTimeout(function () {
                                if (!$scope.isPopupOpen) {
                                    $scope.index = ''
                                    $scope.parentIndex = ''
                                }
                                $scope.successMsg = '';
                                $rootScope.successChecklist = '';
                                $rootScope.errorChecklist = '';
                                $scope.frequencySuccessMsg = false;
                            }, 2000);
                            $scope.isProcessing = false;
                            $scope.dropdownSavingLoader = false;

                        }, function (error) {
                            if ($scope.dropDownMenuSettingsPopup) {
                                $scope.showDropDownMenuError('Something went wrong. Please try again.')
                                $scope.isProcessing = false;
                                $scope.dropdownSavingLoader = false;
                                return
                            } 
                            $scope.checkListFormSubmittting = false;
                            if (!isReorder && error !== 'Something went wrong. Please try again.') {
                                $scope.error = error;
                            }
                            $scope.isProcessing = false;
                            $scope.dropdownSavingLoader = false;
                        });
                    }
            }, delayApi);
        }                
        $scope.enableChecklist = true;
    }
    
    $scope.addNewChecklist = function(workFlowType=''){ 
        // $scope.enableChecklist = false;      
        if($scope.jobId){
            apiGateWay.get("/one_off_job", {
                jobId: $scope.jobId,
            }).then(function(response) {
                $scope.jobAddressId = response.data.data.job.addressId;
            });
        }
        if(!$scope.checkListOneOfJob){
            if($rootScope.templateId){
                var newRowChecklist = {
                    "id":0,
                    "oneOfJobId":$rootScope.templateId, 
                    "title":"", 
                    "required":0,
                    "addressId":0,
                    "isLocal": 1,
                    "photo":0, 
                    "status":1, 
                    "isSystem":0, 
                    "sectionId":1, 
                    "ordering":0,
                    "isTemplate":1,
                    "randomId": 'random_'+Math.floor(Math.random() * 9999999),
                    "workFlowType": workFlowType,
                }
            } else{
                var newRowChecklist = {
                    "id":0,
                    "oneOfJobId":$scope.jobId, 
                    "title":"", 
                    "required":0,
                    "addressId":$scope.jobAddressId,
                    "photo":0, 
                    "status":1, 
                    "isSystem":0, 
                    "isLocal": 1,
                    "sectionId":1, 
                    "ordering":0,
                    "randomId": 'random_'+Math.floor(Math.random() * 9999999),
                    "workFlowType": workFlowType,
                }
            }
            
        } else {
            var newRowChecklist = {            
                "status": 1,
                "addressId": $scope.addressId,
                "isLocal": 1,
                "title": "",
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
                "waterBodyId": $scope.waterBodies[$scope.selectedWaterBody].id,
                "randomId": 'random_'+Math.floor(Math.random() * 9999999),
                "workFlowType": workFlowType,
            }
        }
        if (workFlowType != 'dropDownMenu') {
            $scope.checklistBundle[1].data.unshift(newRowChecklist);
            setTimeout(function(){
                var _ulArray = document.querySelectorAll('ul[data-section-id="1"]');
                var _ul = _ulArray[_ulArray.length - 1];
                var _t = _ul.querySelectorAll('.checklist-textarea-li:nth-child(1) textarea')[0];
                _t.focus();
                // document.getElementsByClassName('pb-checklist-box')[0].scrollTo(500, 0);
            }, 100)    
        }       
    }


    $scope.checklistDeleteConfirm = function(checkListObj, parentIndex, index, type){
        if(checkListObj && checkListObj.id==0){
            if(checkListObj.title=='' || checkListObj.title== undefined){
                    $scope.checklistBundle[parentIndex].data.splice(index, 1);
                    return;
            }
        }
        $scope.checkListObj = checkListObj;
        $scope.parentIndex = parentIndex;
        $scope.index = index;
        $scope.type = type;
        $scope.deleteCheckListModal = ngDialog.open({
            template: 'removeChelistConfirm.html',
            className: 'ngdialog-theme-default',
            scope: $scope,
            preCloseCallback: function () {
              $scope.checkListObj = '';
              $scope.index = '';
              $scope.parentIndex  = '';
              $scope.type = '';
            }
        });
    }
    $scope.confirmChecklistAction = function(checkListObj){
        $scope.enableChecklist = true;
        $scope.isProcessing = true;
        if(checkListObj.sectionId == 1){ parentIndex = 1 }
        else if(checkListObj.sectionId == 2){ parentIndex = 0}
        else { parentIndex = 2};
        const index = $scope.checklistBundle[parentIndex].data.findIndex(obj => obj.id === checkListObj.id);
        if($scope.checkListOneOfJob){
            ngDialog.closeAll()
            apiGateWay.send("/company/delete_checklist", {id: checkListObj.id, addressId: $scope.addressId}).then(function(response) {
                $scope.isProcessing = false;
                if (response.data.status == 200 || response.data.status == '200') {
                    $scope.checklistBundle[parentIndex].data.splice(index, 1);
                }                
            }, function(error){
            $scope.isProcessing = false;
            })
        } else {
            //ngDialog.closeAll()
            if(checkListObj){
                if(checkListObj.title=='' || checkListObj.title== undefined || checkListObj.id == 0){
                    $scope.checklistBundle[parentIndex].data.splice(index, 1);
                    $scope.deleteCheckListModal.close();
                    $scope.isProcessing = false;
                    return;
                }
            }
            apiGateWay.send("/delete_check_list", {id: checkListObj.id,actionPerformed: $rootScope.actionPerformed,"changed_checklist_action": "remove","changed_checklist_name": checkListObj.title, addressId: $scope.addressId, jobId: $scope.jobId ? $scope.jobId : $rootScope.eqTempelateId}).then(function(response) {
                if (response.data.status == 200) {
                    $scope.deleteCheckListModal.close();
                    $rootScope.actionPerformed = null;
                    $scope.checklistBundle[parentIndex].data.splice(index, 1);
                }
                $scope.isProcessing = false;
            }, function(error){
            $scope.isProcessing = false;
            })
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
            var sourceParentIndex =  event.source.nodeScope.$element.attr('data-parent-index');
            var sourceIndex =  event.source.index;
            var destIndex =  event.dest.index;
            var sourceSectionId = event.source.nodeScope.$element.attr('data-section-id');
            var destSectionId = event.dest.nodesScope.$element.attr('data-section-id');
            if(dragType == 'checkList-item' && (sourceSectionId != destSectionId || sourceIndex != destIndex) && !$rootScope.templateId){//drag address 
                setTimeout(function(){
                    checklistBundle = $scope.checklistBundle;
                    checklistBundle.forEach(function(item){
                        if(item.sectionId == destSectionId){
                            parentArray = item.data;
                        }
                    });
                    item = parentArray[destIndex];
                    $scope.saveCheckListItem(parentArray, item, '', true);
                },500);
            } 
            setTimeout(function(){
                $scope.updateCheckListItemHeight()     
            }, 5)           
        },
        beforeDrop: function(event) {
            var dragType = event.source.nodeScope.$element.attr('data-type');
            var sourceParentIndex =  event.source.nodeScope.$element.attr('data-parent-index');
            var sourceIndex =  event.source.index;
            var sourceSectionId = event.source.nodeScope.$element.attr('data-section-id');
            var destSectionId = event.dest.nodesScope.$element.attr('data-section-id');  
            var  isSystem = event.source.nodeScope.$modelValue.isSystem;
            if (isSystem && sourceSectionId != destSectionId){
                return false;
            }            
            if(dragType == 'checkList-item' && sourceSectionId != destSectionId){//drag address  
                // $scope.dragNDropElementId = $scope.checklistBundle[sourceParentIndex].data[sourceIndex].id;
                $scope.checklistBundle[sourceParentIndex].data[sourceIndex].sectionId =  destSectionId;
            }
            return true;
        },
        
        dragStart : function(event) {
            $timeout.cancel(filterTextTimeout);
           /* $scope.setBoxStatusPopup = {}; 
            var body = document.getElementsByTagName('body')[0]
            body.style.overflow = 'hidden';
            body.style.height = '100%';
            */
        },
    }  

    $scope.openFrequencyOptionPopup = function(checkListObj, parentIndex, index, type){
        $scope.frequencyPopupActive = true;
        $scope.singlePopup = true; 
        $scope.checkListObj = checkListObj;
        $scope.index = index;
        $scope.parentIndex = parentIndex;
        $scope.type = type;   
        $scope.isPopupOpen = true;   
        $scope.frequencySuccessMsg = false;  
        $scope.tempFrequency = checkListObj.frequency ? checkListObj.frequency : '';
        $scope.tempDeleteAfter = checkListObj.deleteAfter ? checkListObj.deleteAfter : '';
        $scope.model = {
            frequencyType:checkListObj.frequency ? 2 : 1,
            deleteAfterType:checkListObj.endDate ? 3 : (checkListObj.deleteAfter ? 2 : 1),
            frequency:checkListObj.frequency ? checkListObj.frequency : null,
            deleteAfter:checkListObj.deleteAfter ? checkListObj.deleteAfter : null,
            endDate:checkListObj.endDate
        };    
        if(checkListObj.days && checkListObj.days.length > 0) {
            var days = checkListObj.days.split(',');
            angular.forEach($scope.weekDays, function(item, index) {
                $scope.weekDays[index].status = false;
                if(days.indexOf(item.slug) !== -1) {
                    $scope.weekDays[index].status = true;
                }
            });
        } else {
            angular.forEach($scope.weekDays, function(item, index) {
                $scope.weekDays[index].status = false;
            });
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
                $scope.frequencyPopupActive = false;
                $scope.specificDays = '';
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
            if($scope.model.endDate){
                $scope.initialUpdateDate = false
                $('.datepicker-custom-input').datepicker('update', new Date(moment($scope.model.endDate)));         
            }
        }        
      });
    $scope.chooseDate = function(value){
        $scope.model.deleteAfterType = '3';
        if($scope.initialUpdateDate){       
            $scope.model.deleteAfter = null;     
            // $scope.saveFrequencyTrigger();
            $scope.checkListObj.endDate = value;
            $scope.saveCheckListItem('',$scope.checkListObj, "endDate", false);
        } else {
            $scope.initialUpdateDate = true;
        }
    }

    $scope.setFrequency = function(){
        if($scope.model.frequencyType == 1){
            $scope.model.frequency = null;
            // $scope.saveFrequencyTrigger();
            $scope.checkListObj.frequency = 0;
            $scope.saveCheckListItem('',$scope.checkListObj, "frequency", false);
        } else {
            $window.document.getElementById('frequency').focus();
        }
        
    }

    
    $scope.setDeleteAfter = function(){
        if(['1','3'].indexOf($scope.model.deleteAfterType) > -1){            
            $scope.model.deleteAfter = null; 
            $scope.checkListObj.deleteAfter = 0;
            $scope.checkListObj.endDate = null;
            $scope.saveCheckListItem('',$scope.checkListObj, "deleteAfter", false);
        }
        if(['2'].indexOf($scope.model.deleteAfterType) > -1){
            $window.document.getElementById('deleteAfter').focus();
            $scope.model.endDate = null; 
        } 
        
    } 

    $scope.checkFrequencyInput = function(frequency){
        if(frequency > 1){
            if(frequency != $scope.tempFrequency){
                $scope.tempFrequency = angular.copy(frequency);
                $scope.specificIndex = null;
                $scope.checkListObj.frequency = frequency;
                $scope.saveCheckListItem('',$scope.checkListObj, "frequency", false);   
            }
        } else {
            $scope.tempFrequency = '';
            $scope.model.frequency = ''; 
            // $scope.saveFrequencyTrigger();
            $scope.saveCheckListItem('',$scope.checkListObj, "frequency", false);
        }
    }
    
    $scope.checkDeleteAfterInput = function(deleteAfter){
        if(deleteAfter != $scope.tempDeleteAfter){
            $scope.tempDeleteAfter = angular.copy(deleteAfter);
            // $scope.saveFrequencyTrigger();  
            $scope.checkListObj.deleteAfter = deleteAfter;
            $scope.checkListObj.endDate = null;
            $scope.saveCheckListItem('',$scope.checkListObj, "deleteAfter", false);    
        }     
    }

    $scope.$watch('model.frequency', function (newVal, oldVal) {        
        if(newVal && newVal > 0){          
            $scope.model.frequencyType = '2';
        } else {
            $scope.model.frequency= '';
            $scope.model.frequencyType = '1';
        }
    }, true);

    $scope.$watch('model.deleteAfter', function (newVal, oldVal) {
   
        if(newVal && newVal > 0){
            $scope.model.deleteAfterType = '2';
            $scope.model.endDate = null;
        } else {
            $scope.model.deleteAfter = '';
            if($scope.model.deleteAfterType != '3'){          
                $scope.model.deleteAfterType = '1';
            }
          
        }

    }, true);

  
    //to save install detail
    $scope.saveInstall = function() {
        if($scope.form.saveInstallForm.$valid){
            $scope.isProcessing = true;

            var params = angular.copy($scope.activityModel);
            params.gallanogeCalculated = angular.copy($scope.activityModel.gallanogeCalculated ? $scope.activityModel.gallanogeCalculated : null)
            params['saltSystem'] = params['saltSystem'] ? 'active' : 'no';
            params['waterBodyId'] = $scope.waterBodies[$scope.selectedWaterBody].id;
            //var activityModel = $scope.activityModel;
            apiGateWay.send("/installer_details", {
                "postData": params
            }).then(function(response) {
                if (response.data.status == 201) {
                    //$scope.getInstallHistory($scope.installer.installerId, $scope.activityModel.jobId);
                    $scope.error = '';
                    $scope.installDetail.gallonage = angular.copy($scope.activityModel.gallanogeCalculated || $scope.activityModel.gallanogeCalculated == 0 ? parseFloat($scope.activityModel.gallanogeCalculated) : null);
                    $scope.activityModel.gallanogeCalculated = angular.copy($scope.activityModel.gallanogeCalculated || $scope.activityModel.gallanogeCalculated == 0 ? parseFloat($scope.activityModel.gallanogeCalculated) : null);
                    $scope.installDetail.installerTrackingId = $scope.activityModel.galId;
                    $scope.installDetail.saltSystem = $scope.activityModel.saltSystem;

                    if($scope.activityModel && !$scope.activityModel.jobId){
                        //$scope.getCustomerInfo();
                    }
                    $scope.successMsg = response.data.message;
                } else {
                    $scope.successMsg = '';
                    $scope.error = response.data.message;
                    var analyticsData = {};
                    analyticsData.requestData = $scope.activityModel;
                    analyticsData.userData = $rootScope.userSession;
                    analyticsData.actionTime = new Date();
                    analyticsData.errorData = response.data;
                    var analyticsDataString = JSON.stringify(analyticsData);
                    var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
                    $rootScope.storeAnalytics('Error - Save Install', "Error on saveInstall - " + currentDateTime, analyticsDataString, 0, true);
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
                var analyticsData = {};
                analyticsData.requestData = $scope.activityModel;
                analyticsData.userData = $rootScope.userSession;
                analyticsData.actionTime = new Date();
                analyticsData.errorData = error;
                var analyticsDataString = JSON.stringify(analyticsData);
                var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
                $rootScope.storeAnalytics('Error - Save Install', "Error on saveInstall - " + currentDateTime, analyticsDataString, 0, true);
                $scope.successMsg = '';
                $scope.error = msg;
                setTimeout(function() {
                    $scope.error = '';
                    $scope.isProcessing = false;
                }, 2000);
            });
        }
    }

    $scope.getJobSteps = function(index){   
        if(!$scope.checkListOneOfJob){
            var postData = {         
                "id": $scope.jobId,              
            }
        } else {
            var postData = {         
                "addressId": $scope.addressId,
                "waterBodyId": $scope.waterBodies[$scope.selectedWaterBody].id                
            }
        }
        
        apiGateWay.get('/customer_job_steps', postData).then(function(response) {     
            $scope.jobSteps = response.data.data; 
        }, function(error){
        })
        if(!$scope.checkListOneOfJob){
            $rootScope.saveCheckList();
        }
    }

    $scope.saveJobSteps = function(index){   
        var postData = {
          "beforePicture":$scope.jobSteps.beforePicture ? 1 : 0,
          "psiGaugePicture":$scope.jobSteps.psiGaugePicture ? 1 : 0,
          "psiGaugeReading":$scope.jobSteps.psiGaugeReading ? 1 : 0,
          "afterPicture":$scope.jobSteps.afterPicture ? 1 : 0,
          "addressId":$scope.addressId,
          "serviceLevelId":$scope.jobSteps.serviceLevelId,
          "waterBodyId": $scope.waterBodies[$scope.selectedWaterBody].id
        }
        apiGateWay.send('/company/set_job_steps',postData).then(function(response) {      
            $scope.successMsg = response.data.message;    
            if ($scope.assignedSL.title == '--') {
                $rootScope.refreshWBSection();
            }   
            setTimeout(function(){                  
                $scope.successMsg = false;
            }, 2000)
            $scope.isProcessing = false;
        }, function(error){
            $scope.isProcessing = false;
        })
    }
    
    /* $scope.getChecklistOneOfJob = function(){
        $scope.checkListOneOfJob = false;
        $scope.isProcessing = true;

        if(!$rootScope.eqTempelateId){
            if($scope.jobId){
                $rootScope.templateId = null;
                apiGateWay.get("/one_off_job", {
                    jobId: $scope.jobId,
                }).then(function(response) {
                    $scope.jobAddressId = response.data.data.job.addressId;
                });
            }
            var checklistParam = {jobId : $scope.jobId}
            if($rootScope.templateId){ 
                checklistParam['jobId'] = $rootScope.templateId;
                checklistParam['isTemplate'] = 1;            
            }
            apiGateWay.get('/one_job_check_list', checklistParam).then(function(response) {
                if(response.data.status == 200){
                    $scope.createChecklistSection(response.data.data);
                }  
                $scope.isProcessing = false;              
            }, function(error){
                $scope.addWaterBodyError = error;
                $scope.isProcessing = false;
                setTimeout(function(){
                    $scope.addWaterBodyError = '';                
                }, 2000)
            })
        } else{
            var checklistParam = {jobId : $scope.eqTempelateId}
            checklistParam['isTemplate'] = 1; 
            $rootScope.isBlurOn = false; 
            apiGateWay.get('/one_job_check_list', checklistParam).then(function(response) {
                if(response.data.status == 200){
                    $scope.createChecklistSection(response.data.data);
                }  
                $scope.isProcessing = false;              
            }, function(error){
                $scope.addWaterBodyError = error;
                $scope.isProcessing = false;
                setTimeout(function(){
                    $scope.addWaterBodyError = '';                
                }, 2000)
            })
        }

        
        
          
    }
 */

    $scope.getChecklistOneOfJob = function(){
        $scope.checkListOneOfJob = false;
        $scope.isOneTimeJobPage = true;
        $scope.isProcessing = true;
        var checklistParam = {jobId : ''};
        if($rootScope.eqTempelateId){
            checklistParam['jobId'] = $rootScope.eqTempelateId;
            checklistParam['isTemplate'] = 1;
            $rootScope.isBlurOn = true;
        } else if($rootScope.templateId){
            checklistParam['jobId'] = $rootScope.templateId;
            checklistParam['isTemplate'] = 1;
            $rootScope.isBlurOn = false;
        }else{
            checklistParam['jobId'] = $scope.jobId;
            checklistParam['isTemplate'] = 0;
            $rootScope.isBlurOn = true;
        }
        apiGateWay.get('/one_job_check_list', checklistParam).then(function(response) {
            if(response.data.status == 200){
                $scope.createChecklistSection(response.data.data);
            }  
            $scope.isProcessing = false;              
        }, function(error){
            $scope.addWaterBodyError = error;
            $scope.isProcessing = false;
            setTimeout(function(){
                $scope.addWaterBodyError = '';                
            }, 2000)
        });          
    }

    $rootScope.closeEquipmentPopupCheck = function(){
        $scope.checkListOneOfJob = true;
        $rootScope.templateId = false;
    }

    $rootScope.getChecklistOneOfJob = function(eqTempelateId){
        $scope.isOneTimeJobPage = true;
        $scope.isProcessing = true;
        $rootScope.eqTempelateId = eqTempelateId;
        var checklistParam = {jobId : ''};
        if(eqTempelateId){
            checklistParam['jobId'] = eqTempelateId;
            checklistParam['isTemplate'] = 1;
            $rootScope.isBlurOn = true;
        
        }
        apiGateWay.get('/one_job_check_list', checklistParam).then(function(response) {
            if(response.data.status == 200){
                $scope.createChecklistSection(response.data.data);
            }  
            $scope.isProcessing = false;              
        }, function(error){
            $scope.error = error;
            $scope.isProcessing = false;
            setTimeout(function(){
                $scope.error = '';                
            }, 2000)
        });          
    }

    $rootScope.getChecklistForTemplate = function(templateNameNew){
        $scope.checkListOneOfJob = false;
        $scope.isProcessing = true;
        var checklistParam = {jobId : $scope.jobId}
        
        apiGateWay.get('/one_job_check_list', checklistParam).then(function(response) {
            if(response.data.status == 200){
                $scope.createChecklistSection(response.data.data);
            }  
            $scope.isProcessing = false;              
          }, function(error){
            $scope.addWaterBodyError = error;
              $scope.isProcessing = false;
              setTimeout(function(){
                $scope.addWaterBodyError = '';                
              }, 2000)
          })
    }

    $scope.checkListSetting = function(){
        ngDialog.open({
            template: 'checkListSetting.html',
            className: 'ngdialog-theme-default v-center',
            scope: $scope,
            closeByEscape: $scope.productEdit,
            closeByDocument: $scope.productEdit,
            preCloseCallback: function() {
                $scope.productEdit = false;
            }
        });
    }
    $scope.getNumToStr = (num) => {
        return String(num)
    }
    $scope.isDuplicate = (arr) => {
        var valueArr = [];
        arr.forEach(function(v){
            if (v.title) {
                valueArr.push(v.title)
            }
        });
        // const findDuplicates = (arr) => {
        // let sorted_arr = arr.slice().sort();
        // let results = [];
        // for (let i = 0; i < sorted_arr.length - 1; i++) {
        //     if (sorted_arr[i + 1] == sorted_arr[i]) {
        //         results.push(sorted_arr[i]);
        //     }
        // }
        // return results;
        // }
        var isDuplicate = valueArr.some(function(item, idx){ 
            return valueArr.indexOf(item) != idx 
        });
        return isDuplicate;
    }
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
    $rootScope.isChecklistUpdatingForDuplicateJob = false;
    $scope.$watch('checkListFormSubmittting', function (newVal, oldVal) {        
        $rootScope.isChecklistUpdatingForDuplicateJob = newVal
    });    
    // Multiple checklist
    $scope.addNewChecklistAction = function(workFlowType='', data=null) {
        if (workFlowType == 'dropDownMenu') {
            $scope.addDropDownChecklist(workFlowType, data);
        } else {
            $scope.addNewChecklist(workFlowType);
        }
    }
    $scope.dropDownMenuSettingsPopup = null;
    $scope.addDropDownChecklistModel = {
        workFlowType: 'dropDownMenu',
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
    $scope.dropdownSavingLoader = false;
    $scope.saveDropDownSettings = function(parentArray) {
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
        let data = {
            id: 0,
            title: $scope.addDropDownChecklistModel.title,
            required: 0,
            addressId: $scope.jobAddressId || 0,
            isLocal: 1,
            photo: 0,
            status: 1,
            isSystem: 0,
            sectionId: 1,
            ordering: 0,
            randomId: 'random_' + Math.floor(Math.random() * 9999999),
            workFlowType: $scope.addDropDownChecklistModel.workFlowType,
            options: $scope.sanitizeOptions($scope.addDropDownChecklistModel.options),            
        };        
        if (!$scope.checkListOneOfJob) {
            data.oneOfJobId = $rootScope.templateId || $scope.jobId;
            data.isTemplate = $rootScope.templateId ? 1 : undefined; // Only add when relevant
        } else {
            Object.assign(data, {
                addressId: $scope.addressId,
                deleteAfter: 0,
                endDate: null,
                createTime: "",
                frequency: 0,
                companyId: $scope.companyId,
                edit: 1,
                waterBodyId: $scope.waterBodies[$scope.selectedWaterBody].id,
            });
        }        
        let actionType = 'increment';
        if ($rootScope.templateId) {
            if ($scope.addDropDownChecklistModel._hasData) {

            } else {
                $scope.checklistBundle[1].data.unshift(data);
            }
            $scope.dropDownMenuSettingsPopup.close();
            return
        } else if ($scope.addDropDownChecklistModel.mode == 'edit') {
            data.id = $scope.addDropDownChecklistModel.id;
            actionType = 'title';
        } else {
            $scope.checklistBundle[1].data.unshift(data);
        }
        $scope.dropdownSavingLoader = true;
        $scope.saveCheckListItem(parentArray, data, actionType, false, 0, true)
        }    
    }
    $scope.sanitizeOptions = function(data) {
        if (data && data.length > 0) {
            return data.map(item => ({ title: item.title }));
        } else {
            return [];
        }
    }
    $scope.addDropDownChecklist = function(workFlowType, data) {
        $scope.dropdownSavingLoader = false;
        $scope.addDropDownChecklistModel.workFlowType = workFlowType;
        if (data) {
            $scope.addDropDownChecklistModel.mode = 'edit';
            $scope.addDropDownChecklistModel.id = data.id;
            $scope.addDropDownChecklistModel.title = data.title;
            $scope.addDropDownChecklistModel.options = data.options || [];
            $scope.addDropDownChecklistModel._hasData = true;
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
    $scope.$watch('checklistBundle', function (newVal, oldVal) {            
        setTimeout(function(){
            $scope.updateCheckListItemHeight()
        }, 5)
    }, true);
});
