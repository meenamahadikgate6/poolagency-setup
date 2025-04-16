angular.module('POOLAGENCY').controller('remoteDataDetailController', function($rootScope, $scope,$window, Carousel, deviceDetector, $timeout, $filter, $sce, apiGateWay, service, $state, $stateParams, ngDialog, Analytics, configConstant, auth) {
    $rootScope.routeStopCustomerCustomerInfo = null;
    $scope.isPropertyInformation = configConstant[configConstant.currEnvironment].isPropertyInformation;
    $scope.isServiceSchedule = configConstant[configConstant.currEnvironment].isServiceSchedule;
    $scope.addressId = $stateParams.addressId;
    $scope.deviceWaterBodyId = $stateParams.deviceWaterBodyId;
    $scope.selectDate = '';
    $scope.currentPage = 1;
    $scope.limit = 5;
    $scope.dir = 'asc';
    $scope.column = 'technicianName';
    $scope.isProcessing = false;
    $scope.weekDate = "";
    $scope.gaugeDescription='';
    $scope.managerProfileImage = '';
    $scope.defaultAvatar = '';
    $scope.technicianName = '';
    $scope.technicianFirstName = '';
    $scope.technicianLastName = '';
    // $scope.slides = [];
    $scope.dismissAlertSettingError = false;
    $scope.activityTitle = null;
    $scope.noJobDataAvailable = '';
    $scope.timeError = '';
    $scope.filterModel = {
        filterMonth: '90 days'
    }
    $scope.filterMonth2 = '90 days';
    $scope.jobActivityTime = {'deviceWaterBodyId':$scope.deviceWaterBodyId,'startDate':{'isUpdated':false, 'time':''},'endDate':{'isUpdated':false, 'time':''}};
    $scope.lastActivityTime = {'startDate':'','endDate':''};
    $scope.startTimePickerOption = {format: 'DD-MM-YYYY   hh:mm a', showClear: false, sideBySide: true}
    $scope.endTimePickerOption = {format: 'DD-MM-YYYY   hh:mm a', showClear: false, sideBySide: true}
    $scope.activitychanged = false;
    $scope.startJobLog = [];
    $scope.endJobLog = [];
    $scope.showLoader = false;
    $scope.chemicalReadingLogs = {};
    $scope.dateRangeModel = {
        graphFromDate: "",
        graphToDate: ""
    }
    $scope.tempCValue = '';
    $scope.chemicalStatusModel = {};
    $scope.loadingChemical = false;
    $scope.paramWaterBodyId = '';
    $scope.permissions = {};
    $scope.dataId = Number($stateParams.dataId);
    if (auth.getSession()) {
        $scope.permissions = auth.getSession();
    }
    $scope.canEditReadings = auth.getSession().canEditReadings == 0 ? true : false;
    $scope.chemicalReading = {
        "chlorine": "",
        "ph": "",
        "phosphates": "",
        "salt": "",
        "alkalinity": "",
        "tds": "",
        "cya": ""
    };
   
    $scope.onExit = function() {
        $rootScope.addUpdateManager("remove", $scope.dataId, 'remoteData');
        
        /* if($state.current.name == 'app.customerjobdetail'){
          return false;
        } */
        return;
    };
    $scope.$on("$destroy", function () {
        $rootScope.getJobDetailByWaterBody = null;
        $rootScope.showCaptionInCustomerEmail = null;
        $rootScope.routeStopCustomerCustomerInfo = null;
    })

    $scope.downloadFile = function(url){
        var fileName = url.substr(url.lastIndexOf("/")+1);
            var imageUrl = url;
            var tag = document.createElement('a');
            tag.href = imageUrl;
            tag.download = fileName;
            tag.setAttribute('target','_blank');
            document.body.appendChild(tag);
            tag.click();
            document.body.removeChild(tag);
    }

    $scope.displayAsMultiLine = function(issObj){
      var noteStr = issObj.description;
      var finalText = issObj.description ? issObj.description : '';
      if(issObj.time){
        let timeStr = issObj.time;
        finalText += ' ' + timeStr;
      }
      return finalText;

    }

    var crowlerPlaceHolderImages = [{
        assetsType:"No Image",
        fileName:"No Image",
        filePath:"https://uat.tritontracking.com/admin/resources/images/no-sync-image.jpg",
        image:"https://uat.tritontracking.com/admin/resources/images/no-sync-image.jpg",
        filetype:"image"
    }];

    var actionName = "";
    actionName += "Page - Remote data monitoring\n";
    actionName += "Action - Remote data monitoring page opened\n";
    $rootScope.addAuditLog($scope.dataId, actionName, 'remoteData');
    $window.onbeforeunload = $scope.onExit;

    $scope.toggleConfirm = function() {
        $scope.overRide = false;
        if (!$scope.confirmOpen) {
            $scope.confirmOpen = true;
        } else {
            $scope.confirmOpen = false;
        }
    };
    $scope.toggleOverRide = function() {
        $scope.confirmOpen = false;
        if (!$scope.overRide) {
            $scope.overRide = true;
        } else {
            $scope.overRide = false;
        }
    };

    //to show pictures in dialog
    $scope.showPicturesVideos = function(event, type) {

      if(event.target.tagName.toLowerCase() == "i"){
          event.preventDefault();
          return;
      }
      $scope.navigateToJobImages();
      return
    };

    $scope.navigateToJobImages = function(){
        $state.go('app.customerjobimages', {
            deviceWaterBodyId: $scope.deviceWaterBodyId
        });
    }

    $scope.alertPictures = {};
    //to show alerts pictures in dialog
    $scope.showAlertPictures = function(images) {
        images = images.length > 0 ? images : crowlerPlaceHolderImages;
        $scope.alertPictures = images;

        var actionName = "";
        actionName += "Page - Remote data monitoring\n";
        actionName += "Action - Job alert pictures viewed\n";
        $rootScope.addAuditLog($scope.dataId, actionName, 'remoteData');
        ngDialog.open({
            template: 'alertPictures.html',
            className: 'ngdialog-theme-default',
            scope: $scope,
            preCloseCallback: function() {}
        });
    };
    $scope.installDetail = {};
    $scope.jobSensor = {};
    $scope.isInstall = false;


    $scope.saltSystemData = {
        "active": "Active Salt System",
        "present": "Present but Non-Functional",
        "no": "No Salt System"
    };

     //to get customer information
    $scope.checkListArray = [];
    $scope.serviceLevelArray = [];
    $scope.assignedSL = '';
    $scope.getCustomerInfo = function() {
        $scope.isProcessing = true;
        var pdata = { addressId: $scope.addressId };
        if ($scope.dateRangeModel.graphFromDate != '' && $scope.dateRangeModel.graphToDate != '') {
            pdata.startDate = $filter('date')(new Date($scope.dateRangeModel.graphFromDate), 'yyyy-MM-dd');
            pdata.endDate = $filter('date')(new Date($scope.dateRangeModel.graphToDate), 'yyyy-MM-dd');
        }
        $rootScope.title = 'Remote Data Received';
        $rootScope.rootDeviceId = $scope.dataId;
        apiGateWay.get("/waterguru_customer_details", pdata).then(function(response) {
            if (response.data) {
                if (response.data.status == 200) {
                    $scope.customerinfo = response.data.data;
                    $rootScope.routeStopCustomerCustomerInfo = $scope.customerinfo.customer;
                    //$scope.addressJobDetails = $scope.customerinfo.addressJobDetails;
                    $scope.installDetail = $scope.customerinfo.installDetail;
                    $scope.installDetail.gallonage = $scope.customerinfo.installDetail.gallonage ? $scope.customerinfo.installDetail.gallonage : null;
                    
                    $rootScope.checkListArrayParent = response.data.data.checkList
                    $rootScope.serviceLevelArrayParent = response.data.data.serviceLevel;
                    $rootScope.assignedSLParent = response.data.data.assignedSL;
                    
                    $scope.activityModel.gallanogeCalculated = $rootScope.gallanoges ? parseFloat($rootScope.gallanoges) : null;
                    $scope.activityModel.galId = $scope.installDetail.installerTrackingId;
                    $scope.activityModel.saltSystem = $scope.installDetail.saltSystem && $scope.installDetail.saltSystem =='active' ? true : false;
                    $scope.activityModel.saltId = $scope.installDetail.saltId ? $scope.installDetail.saltId : 0;
                    $scope.activityModel.deviceWaterBodyId = $scope.installDetail.deviceWaterBodyId;

                    $scope.installer = $scope.customerinfo.installer;
                    $scope.jobSensor = $scope.customerinfo.jobSensorData;
                    $scope.isInstall = (Object.keys($scope.installDetail).length > 0 && $scope.installDetail.gallonage) ? true : false;
                    $scope.jobType = $scope.customerinfo.customer.jobType && $scope.customerinfo.customer.jobType == 'chemical' ? true : false;
                    $scope.activityModel.jobType = $scope.jobType;

                    $rootScope.activityModelParent = $scope.activityModel;
                    $rootScope.installDetailParent = $scope.installDetail;
                    $rootScope.waterBodyTypeDefault = response.data.data.waterBodyType;
                    $rootScope.waterBodiesParent = response.data.data.waterBodies;
                    if($stateParams.waterBodyId){
                        $scope.paramWaterBodyId =  $stateParams.waterBodyId;
                    }
                   
                    $rootScope.getChecklistItemDetail($scope.paramWaterBodyId );

                    

                    $rootScope.custAddrDetailsData = response.data.data.custAddrDetailsData[1];
                    if($scope.isPropertyInformation) { $rootScope.getPropertyItemDetails(); }            

                    //$scope.getInstallHistory(response.data.data.installer.installerId, $scope.deviceWaterBodyId);                   
                  
                } else {
                    $scope.customerinfo = [];
                }
            }
            $scope.isProcessing = false;
        }, function(error) {
            var analyticsData = {};
            analyticsData.requestData = pdata;
            analyticsData.userData = $rootScope.userSession;
            analyticsData.actionTime = new Date();
            analyticsData.errorData = error;
            var analyticsDataString = JSON.stringify(analyticsData);
            var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
            $rootScope.storeAnalytics('Error - Get Customer Info', "Error on getCustomerInfo - " + currentDateTime, analyticsDataString, 0, true);
        });
        $scope.isProcessing = true;
        $scope.getJobDetails($scope.addressId, {});
    };

    $rootScope.deleteJobConfirm = function(){                  
        ngDialog.open({            
            id  : 11,
            template: 'deleteJobConfirm.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function () {
                
            }
        });
    }

    $scope.jobDateLogs = function(sJobId,jobHistory, startTime){
        
        $scope.jobActivityTime.currentDate =  startTime;
        $scope.startJobLog = [];
        $scope.endJobLog = [];     
        $scope.jobActivityTime.deviceWaterBodyId = sJobId;   
        $scope.jobActivityTime['startDate'].isUpdated = false;
        $scope.jobActivityTime['endDate'].isUpdated  = false;

        $scope.jobActivityTime['startDate'].time = '';
        $scope.jobActivityTime['endDate'].time = '';
        angular.forEach(jobHistory, function(value, key) {
            if(value.title=="Start Job"){
                let jodStartDateStr =value.createTime.replace('Z','');
                $scope.jobActivityTime['startDate'].time = jodStartDateStr; 
                $scope.lastActivityTime['startDate'] = jodStartDateStr;
                $scope.jobActivityTime['startDate'].trackingId = value.installerTrackingId;
                //let maxTime=jobHistory[key+1].createTime;
                //$scope.startTimePickerOption.maxDate = $filter('date')(new Date(maxTime), "hh:m:ss a");
            }
            if(value.title=="Job Finished"){
                let jodEndDateStr = value.createTime.replace('Z','');
                $scope.jobActivityTime['endDate'].time = jodEndDateStr; 
                $scope.lastActivityTime['endDate'] = jodEndDateStr;
                $scope.jobActivityTime['endDate'].trackingId = value.installerTrackingId;
                //minTime=jobHistory[key-1].createTime;
                //$scope.endTimePickerOption.minDate = $filter('date')(new Date(minTime), "hh:m:ss a");
            }

        });
        apiGateWay.get("/job_date_logs?deviceWaterBodyId="+$scope.jobActivityTime.deviceWaterBodyId).then(function(response) {  
            if (response.data.status == 200) {
                let responseData = response.data.data;
               angular.forEach(responseData, function(editLog) {
                    if($scope.jobActivityTime['startDate'].trackingId == editLog.installerTrackingId && editLog.newDate != editLog.oldDate){
                        $scope.jobActivityTime['startDate'].isUpdated = true;
                        editLog.createTime = moment(editLog.createTime).local().format();
                        $scope.startJobLog.push(editLog);
                    }
                    if($scope.jobActivityTime['endDate'].trackingId == editLog.installerTrackingId && editLog.newDate != editLog.oldDate){
                        $scope.jobActivityTime['endDate'].isUpdated = true;
                        editLog.createTime = moment(editLog.createTime).local().format();
                        $scope.endJobLog.push(editLog);
                    }
                 }); 
            }
        }, function(error){
        });

       /*  setTimeout(function(){
            $('.endJobInput').datepicker('update');
          }, 200); */
        
    };
    $scope.deleteJobConfirmAction = function(){
        $scope.isProcessing = true;
        apiGateWay.send("/delete_waterguru_data", { "waterDeviceDataId": $scope.dataId }).then(function(response) {
            if (response.data.status == 200) {
                $state.go("app.customerdetail", { addressId: $scope.addressId });
            }
            $scope.isProcessing = false;
        }, function(error){
            $scope.isProcessing = false;
        })
        ngDialog.close();
    };

    $scope.confirmChecklistAction = function(checkListObj, index){
        $scope.isProcessing = true;
        ngDialog.closeAll()
        apiGateWay.send("/company/delete_checklist", {id: checkListObj.id, addressId: $scope.addressId}).then(function(response) {
            if (response.data.status == 200) {
                $scope.checkListArray.splice(index, 1);
            }
            $scope.isProcessing = false;
        }, function(error){
          $scope.isProcessing = false;
        })
    }

    //to save install detail
    $scope.saveInstall = function() {
        $scope.isProcessing = true;
        var params = angular.copy($scope.activityModel);
        params['saltSystem'] = params['saltSystem'] ? 'active' : 'no';
        var activityModel = $scope.activityModel;
        apiGateWay.send("/installer_details", {
            "postData": params
        }).then(function(response) {
            if (response.data.status == 201) {
                //$scope.getInstallHistory($scope.installer.installerId, $scope.activityModel.deviceWaterBodyId);
                $scope.error = '';
                $scope.installDetail.gallonage = $scope.activityModel.gallanogeCalculated || $scope.activityModel.gallanogeCalculated == 0 ? parseFloat($scope.activityModel.gallanogeCalculated) : null;
                $scope.installDetail.installerTrackingId = $scope.activityModel.galId;
                $scope.installDetail.saltSystem = $scope.activityModel.saltSystem;

                if($scope.activityModel && !$scope.activityModel.deviceWaterBodyId){
                    $scope.getCustomerInfo();
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

    $scope.activityModel = {
        "galId": 0,
        "saltId": 0,
        "deviceWaterBodyId": "",
        "gallanogeCalculated": null,
        "saltSystem": "",
        "addressId": $scope.addressId
    }

    $scope.updateJobType=function(){
        $scope.isProcessing = true;
        var jobType = $scope.activityModel.jobType ? "chemical" : "complete";
        var jobTypeModel = {"jobType":jobType,"addressId":$scope.addressId}
        apiGateWay.send("/address_sync", jobTypeModel).then(function(response) {
            if (response.data.status == 201) {
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


    //update selected deviceWaterBodyId, and update section on the basis of selected Job ID 
    $scope.initJobDetails = false;
    $rootScope.getJobDetailByWaterBody = function(waterBodyObj) {
        $scope.subJobId = angular.copy(waterBodyObj.addressId ? waterBodyObj.addressId : '');    
        $scope.waterBodyId = angular.copy(waterBodyObj.id ? waterBodyObj.id : '');  
        $scope.waterBodyObj = waterBodyObj;        
        $rootScope.initGraphArea($scope.addressId, $scope.waterBodyId, $scope.subJobId, 'remoteData');
        if($scope.subJobId){
            $scope.jobImages($scope.deviceWaterBodyId)
            // $scope.getChemicalInput($scope.subJobId) 
            $scope.getChemicalReading($scope.subJobId)     
     
            if($scope.initJobDetails){
        
                $scope.getJobDetails($scope.subJobId, {}, true);                
            }
            $scope.noJobDataAvailable = '';
        }  else {
            $scope.noJobDataAvailable = 'No job data to show for this body of water';
        } 
        $scope.initJobDetails = true;
              
    }
    $scope.customerNotes = [];
    $scope.getInstallHistory = function(installerId, deviceWaterBodyId) {
       
        $scope.isProcessing = true;
        var pdata = {
            addressId: $scope.addressId,
            installerId: installerId,
            deviceWaterBodyId: deviceWaterBodyId,
            type: "technician",
        };      
        apiGateWay.get("/installer_history", pdata).then(function(response) {
            var responseData;
            if (response.data) {
                if (response.data.status == 200) {
                    
                    responseData = response.data.data;
                    if (responseData.totalMinutes && responseData.totalMinutes.includes('mins')) {
                        responseData.totalMinutes = $rootScope.calculateMins(responseData.totalMinutes)
                    }
                    
                    $scope.installerHistory = responseData;
                    $scope.instHistory = responseData.instHistory;
                    $scope.installNotes = responseData.installNotes;
                    if (responseData.customerNotes && responseData.customerNotes.length > 0) {
                        $scope.customerNotes = responseData.customerNotes;
                    }                  
                    $scope.totalMinutes = responseData.totalMinutes;
                    $scope.startDate = responseData.startDate;
                    let jobDetails = $scope.jobDetails;
                    $scope.jobDetails = jobDetails;
                    $scope.parseJobDetails(jobDetails);
                    $scope.jobDateLogs(Number(pdata.deviceWaterBodyId), $scope.instHistory,$scope.installerHistory.startDate);

                } else {
                    
                    $scope.customerinfo = [];
                    var analyticsData = {};
                    analyticsData.requestData = pdata;
                    analyticsData.userData = $rootScope.userSession;
                    analyticsData.actionTime = new Date();
                    analyticsData.errorData = response.data;
                    var analyticsDataString = JSON.stringify(analyticsData);
                    var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
                    $rootScope.storeAnalytics('Error', "Error on getInstallHistory - " + currentDateTime, analyticsDataString, 0, true);
                }
            }
            $scope.isProcessing = false;
        }, function(error) {
            $scope.isProcessing = false;
        });
    }  

    $scope.getChemicalReading = function(subJobId) {
        $scope.chemicalReading = {};
        if (subJobId) {
            apiGateWay.get("/waterdevice_chemicals_readings", {
                deviceWaterBodyId: subJobId,
                dataId: $scope.dataId
            }).then(function(response) {
                if (response.data) {
                    if (response.data.status == 200) {
                        $scope.chemicalReadingUnit = response.data.data['chemical_unit'];
                        if(response.data.data['chemical_readings'].length > 0){
                            $scope.chemicalReading = angular.copy(response.data.data['chemical_readings'][0]);                          
                            
                            angular.forEach($scope.chemicalReading, function(value, key) {
                                var t = key + "_defaultValue"
                                if ($scope.chemicalReading[t] != undefined) {
                                    if(typeof value === 'string'){
                                        $scope.chemicalReading[key] = parseFloat(value)
                                    }
                                    if (value == -1 || value == -1.0 || value == "-1.0") {
                                        $scope.chemicalReading[key] = null;
                                    }
                                    
                                }
                            });
                        }
                        $scope.chemicalReadingDefault = angular.copy($scope.chemicalReading);
                        $scope.getChemicalReadingLogs(subJobId, response.data.data['chemical_readings'][0]);
                    }
                }
            }, function(error) {
            });
        }
    }
    $scope.getChemicalReadingLogs = function(subJobId, chemicalReading){
        //$scope.chemicalReadingLogs = [];
        if (subJobId) {
            apiGateWay.get("/device_reading_logs", { waterDeviceDataId: $scope.dataId }).then(function(response) {
                if (response.data) {
                    if (response.data.status == 200) {
                        if(chemicalReading && Object.entries(chemicalReading).length > 0){
                            angular.forEach(chemicalReading, function(value, key) {
                                let tooltip = '';
                                let reading = response.data.data.filter(function(item, index){                               
                                    return item.chemicalName == key;
                                })
                                angular.forEach(reading, function(item,index){
                                    if(index == 0){                                   
                                        if (item.existValue == -1 || item.existValue == -1.0 || item.existValue == "-1.0" || item.existValue == "null" || !item.existValue) {                                   
                                            tooltip += 'Technician did not enter any value';
                                        } else {
                                            tooltip += 'Technician entered '+item.existValue;
                                        }                                    
                                    }
                                    let userDisplayName = item.updatedBy &&  item.updatedBy.length > 2 ? item.updatedBy : item.firstName+' '+item.lastName;
                                    if (item.value == -1 || item.value == -1.0 || item.value == "-1.0" || item.value == "null" || !item.value) {                                        
                                        tooltip += '<br />Changed to blank by '+ userDisplayName +' - '+$filter('date')(item.createTime, "MM/dd/yyyy");
                                    } else {
                                        tooltip += '<br />Changed to '+item.value+' by ' +userDisplayName+' - '+$filter('date')(item.createTime, "MM/dd/yyyy");
                                    }
                                        
                                    
                                })
                                if(reading.length == 0){
                                    tooltip = 'noText';
                                }
                                
                                $scope.chemicalReadingLogs[key] = tooltip;
                            });
                        }
                        angular.forEach($scope.chemicalStatus, function(value, parentIndex) {
                            let tooltip = '';
                            let reading = response.data.data.filter(function(item, index){                              
                                return item.chemicalName == value.keyName;
                            })
                            angular.forEach(reading, function(item, index){  
                                
                                if(index == 0){
                                    if (item.existValue == -1 || item.existValue == -1.0 || item.existValue == "-1.0" || item.existValue == null) {                                   
                                        tooltip += 'Technician did not enter any value';
                                    } else {
                                        tooltip += 'Technician entered '+item.existValue;
                                    }                                       
                                }
                                let userDisplayName = item.updatedBy &&  item.updatedBy.length > 2 ? item.updatedBy : item.firstName+' '+item.lastName;
                                tooltip += '<br />Changed to '+item.value+' by '+userDisplayName+' - '+$filter('date')(item.createTime, "MM/dd/yyyy");
                                
                            })
                            if(reading.length == 0){
                                tooltip = 'noText';
                            }
                            $scope.chemicalReadingLogs[value.keyName] = tooltip;
                        });
                        $scope.loadingChemical = true;
                        $scope.isProcessing = false;
                    }
                }
            }, function(error) {
            $scope.isProcessing = false;
            });
        }
    }
 
    $scope.validateCTabs = function(e, index){
        let n = String(e.target.value).split("."); 
        if (e.target.value.length == 4 && (n[0].length > 1 || n[1].length > 1)) {
            $scope.chemicalStatusModel.chemicalStatus[index].value = e.target.value.slice(0, -1);            
        }      
    }
  

    $scope.updateChemicals = function(type, name, value, existingValue){
        var isBothNull = (existingValue == null && value == null) ? true : false;
        var isDifferent = value != existingValue; 
        value = '' + value;
        if(value.includes('.')) {
            var _valArr = value.split('.')
            var beforeDec = _valArr[0];
            var afterDec = _valArr[1];
            if(afterDec.length == 1) {
                afterDec = afterDec + '0'
            }
            value = beforeDec + '.' + afterDec
        }       
        if(!isBothNull && isDifferent){
            if(type != 'reading' && ((existingValue == 0 && value == undefined) || (existingValue == undefined && value == 0)) ){ return false; }
            if($scope.loadingChemical){
                $scope.isProcessing = true;
            }
            let userId = $rootScope.userSession.id;
            if (value == undefined || value == 'undefined' || value == null || value == "null" || !value) {
                value = ''
            }
            let postData = {
                "value":value,
                "WaterDeviceDataId": Number($scope.dataId),
                "chemicalName":name,
                "userId":userId,
                "isExistReading":type == 'reading' ? 1 : 0,
                "isAdmin": $scope.permissions.superAdmin ? $scope.permissions.superAdmin : 0
            }
            apiGateWay.send("/waterdevice_chemicals_readings", postData).then(function(response) {
                if (response.data.status == 200) {
                    // $scope.getChemicalInput($scope.subJobId) 
                    $scope.getChemicalReading($scope.deviceWaterBodyId);
                    $rootScope.initGraphArea($scope.addressId, $scope.waterBodyId, $scope.subJobId, 'remoteData');
                }
                $scope.isProcessing = false;
            }, function(error){
              $scope.isProcessing = false;
            })
        }
        

    }
    $scope.confirmChecklistAction = function(checkListObj, index){
        $scope.isProcessing = true;
        ngDialog.closeAll()
        apiGateWay.send("/company/delete_checklist", {id: checkListObj.id, addressId: $scope.addressId}).then(function(response) {
            if (response.data.status == 200) {
                $scope.checkListArray.splice(index, 1);
            }
            $scope.isProcessing = false;
        }, function(error){
          $scope.isProcessing = false;
        })
    }

    // to store analytic data on close job
    $scope.closeJob = function(jobDetail) {
        var analyticsData = {};
        analyticsData.userData = $rootScope.userSession;
        analyticsData.data = jobDetail;
        analyticsData.actionTime = new Date();
        var analyticsDataString = JSON.stringify(analyticsData);
        var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
        $rootScope.storeAnalytics('Jobs', "Jobs - Close Job - " + jobDetail.deviceWaterBodyId + " - " + currentDateTime, analyticsDataString, 0, true);
    }
    $scope.overridenModel = [];
    $scope.hideAlertIssueIds = {
        "client": [],
        "system": []
    };
    //to submit override data
    $scope.submitOveride = function(overRideNote) {
        if (overRideNote) {
            $scope.isProcessing = true;
            apiGateWay.send("/update_alert", {
                issueId: $scope.selectedAlertIssueId,
                overideNote: overRideNote,
                issueType: $scope.openedIssueType,
                title: $scope.issueObj.title ? $scope.issueObj.title : $scope.issueObj.description,
                isConfirm: 0
            }).then(function(response) {
                
                

                var analyticsData = {};
                analyticsData.userData = $rootScope.userSession;
                analyticsData.data = {
                    deviceWaterBodyId: $scope.openedJobId,
                    overRideNote: overRideNote,
                    issueId: $scope.selectedAlertIssueId
                };
                $scope.showDot[$scope.openedIssueType][$scope.selectedAlertIssueId] = false;

                $scope.successOveride = 'Alert has been overridden successfully';
                angular.element(document.getElementById("btn" + $scope.selectedAlertIssueId)).prop("disabled", true).addClass('disabledBtn');
                var isJobCompleted = response.data.data.isJobComplete;
                if (isJobCompleted) {
                    if (isJobCompleted == 1) {
                        if (response.data.data.jobDetail) {
                            $scope.closeJob(response.data.data.jobDetail);
                        }
                    }
                }
                if(typeof $rootScope.socket != 'undefined'){
                    var companyId = auth.getSession().companyId

                    $rootScope.socket.emit("checkPendingJobCount", {
                        companyId: companyId, 
                        alertType: $scope.openedIssueType, 
                        alertIssueId: $scope.selectedAlertIssueId, 
                        isJobCompleted: isJobCompleted, 
                        deviceWaterBodyId: $scope.openedJobId
                    });
                }

                $scope.isProcessing = false;
                var actionName = "";
                var alertTitle = $scope.issueObj.title != undefined ? $scope.issueObj.title : $scope.setTitle($scope.issueObj.type);
                actionName += "Page - Remote data monitoring\n";
                actionName += "Action - " + alertTitle + " alert overridden \n";
                $rootScope.addAuditLog($scope.dataId, actionName, 'remoteData');
                $scope.alertTimeout = setTimeout(function() {
                    $scope.successOveride = '';
                    $scope.openedIssueType = '';
                    $scope.selectedAlertIssueId = '';
                    $scope.issueObj = "";
                    if (!$scope.$$phase) $scope.$apply();
                    $scope.alertTimeout = false;
                }, 2000);
                analyticsData.actionTime = new Date();
                var analyticsDataString = JSON.stringify(analyticsData);
                var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
                $rootScope.storeAnalytics('Alerts - Override', "Alerts - Submit Override - " + $scope.openedJobId + " - " + currentDateTime, analyticsDataString, 0, true);
            }, function(error) {
                $scope.errorOveride = error;
                var analyticsData = {};
                analyticsData.requestData = {
                    issueId: $scope.selectedAlertIssueId,
                    overideNote: overRideNote,
                    issueType: $scope.openedIssueType,
                    isConfirm: 0
                };
                analyticsData.userData = $rootScope.userSession;
                analyticsData.actionTime = new Date();
                analyticsData.errorData = error;
                var analyticsDataString = JSON.stringify(analyticsData);
                var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
                $rootScope.storeAnalytics('Error - submitOveride', "Error on Submit Override - " + currentDateTime, analyticsDataString, 0, true);
                setTimeout(function() {
                    $scope.errorOveride = '';
                }, 2000);
                $scope.isProcessing = false;
            });
        }
    };
    //to submit confirm data
    $scope.callConfirmSubmit = function(isDismissed) {       
        if(isDismissed && $scope.dismissAlertSetting.validateNotes && !$scope.jobDetails.alertsIssueArray[$scope.openedIssueType][$scope.selectedAlertIssueId].customNote){
            $scope.dismissAlertSettingError = true;
           
            return false;
        }
        
        if ($scope.selectedAlertIssueId && $scope.jobDetails.alertsIssueArray[$scope.openedIssueType][$scope.selectedAlertIssueId].confirmDetail) {
            $scope.isProcessing = true;
            var confirmDetail = $scope.jobDetails.alertsIssueArray[$scope.openedIssueType][$scope.selectedAlertIssueId].confirmDetail;
            confirmDetail['isDismissed'] = isDismissed
            apiGateWay.send("/update_alert", {
                issueId: $scope.selectedAlertIssueId,
                isConfirm: 1,
                issueType: $scope.openedIssueType,
                confirmDetails: confirmDetail
            }).then(function() {
                var analyticsData = {};
                analyticsData.userData = $rootScope.userSession;
                analyticsData.data = {
                    "deviceWaterBodyId": $scope.deviceWaterBodyId,
                    "confirmDetails": $scope.jobDetails.alertsIssueArray[$scope.openedIssueType][$scope.selectedAlertIssueId].confirmDetail,
                    "issueId": $scope.selectedAlertIssueId
                };

                service.jobDetails[$scope.dataId] = $scope.jobDetails;
                $scope.showDot[$scope.openedIssueType][$scope.selectedAlertIssueId] = !checkConfirmDetail(JSON.stringify($scope.jobDetails.alertsIssueArray[$scope.openedIssueType][$scope.selectedAlertIssueId].confirmDetail));

                if (isDismissed) {
                    var actionName = "";
                    var alertTitle = $scope.issueObj.title != undefined ? $scope.issueObj.title : $scope.setTitle($scope.issueObj.type);
                    actionName += "Page - Remote data monitoring\n";
                    actionName += "Action - " + alertTitle + " alert confirmed\n";
                    $scope.addAuditLog($scope.dataId, actionName, 'remoteData');
                    $scope.hideAlertIssueIds[$scope.openedIssueType][$scope.selectedAlertIssueId] = "";
                    $scope.hideAlertIssueIds[$scope.openedIssueType][$scope.selectedAlertIssueId] = true;
                    $scope.issueObj['closeStatus'] = 1;
                    $scope.issueObj['confirmDetail'] = confirmDetail;                   
                    $scope.issueObj['managerName'] = $scope.serviceManagerName;
                    $scope.issueObj['managerFirstName'] = $scope.serviceManagerFirstName;
                    $scope.issueObj['managerLastName'] = $scope.serviceManagerLastName;
                    $scope.issueObj['managerImage'] = $scope.managerProfileImage;
                    $scope.getJobDetails($scope.deviceWaterBodyId);
                    $scope.isProcessing = false;
                }else{
                    $scope.isProcessing = false;
                }

                analyticsData.actionTime = new Date();
                var analyticsDataString = JSON.stringify(analyticsData);
                var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
                $rootScope.storeAnalytics('Alerts - Confirm', "Alerts - Submit Confirm JobId - " + $scope.openedJobId + " - " + currentDateTime, analyticsDataString, 0, true);
            }, function(error) {
                $scope.isProcessing = false;
                var analyticsData = {};
                analyticsData.requestData = {
                    issueId: $scope.selectedAlertIssueId,
                    isConfirm: 1,
                    issueType: $scope.openedIssueType,
                    confirmDetails: $scope.jobDetails.alertsIssueArray[$scope.openedIssueType][$scope.selectedAlertIssueId].confirmDetail
                };
                analyticsData.userData = $rootScope.userSession;
                analyticsData.actionTime = new Date();
                analyticsData.errorData = error;
                var analyticsDataString = JSON.stringify(analyticsData);
                var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
                $rootScope.storeAnalytics('Error - confirm submit', "Error on Submit Confirm - " + currentDateTime, analyticsDataString, 0, true);
            });
        }
    };
    $scope.chemicalCalculation = [];
    //to get chemical inputs of the job
    $scope.getChemicalInput = function(subJobId) {
        if (subJobId) {
            apiGateWay.get("/chemicals_input", {
                deviceWaterBodyId:subJobId
            }).then(function(response) {
                if (response.data) {
                    if (response.data.status == 200) {
                      if (response.data.data['chemicalBalance'].length > 0) {
                          $scope.chemicalCalculation = response.data.data['chemicalBalance'];
                      }
                      if (response.data && response.data.data && response.data.data['chemicalStatus']) {
                          $scope.chemicalStatus = angular.copy(response.data.data['chemicalStatus']);
                          $scope.chemicalStatusDefault = angular.copy(response.data.data['chemicalStatus']);
                          $scope.chemicalStatusModel.chemicalStatus =  angular.copy(response.data.data['chemicalStatus']);
                      }
                      $scope.getChemicalCost($scope.waterBodyId);
                    }
                }
                
            }, function(error) {
            });
        }
    }
    $scope.confirmOpen = false;
    $scope.overRide = false;
    $scope.$watch('jobDetails.alertsIssueArray[openedIssueType][selectedAlertIssueId].overrideNote', function(o, n) {
        if (o != undefined) {
            angular.element(document.getElementById("btn" + $scope.selectedAlertIssueId)).prop("disabled", false).removeClass('disabledBtn');
        } else {
            angular.element(document.getElementById("btn" + $scope.selectedAlertIssueId)).prop("disabled", true).addClass('disabledBtn');
        }
    });
    //to set alert Title
    $scope.setTitle = function(alertType) {
        var selectedTabName = alertType;
        if (alertType == 'WaterLevelLow') {
            selectedTabName = 'Water Level Low';
        } else if (alertType == 'GreenPool') {
            selectedTabName = 'Algae';
        } else if (alertType == 'NoPower') {
            selectedTabName = 'No Power';
        } else if (alertType == 'SystemDown') {
            selectedTabName = 'System Down';
        } else if (alertType == 'NoAccess') {
            selectedTabName = 'No Access';
        } else if (alertType == 'Weather') {
            selectedTabName = 'Weather';
        } else if (alertType == 'RepairNeeded') {
            selectedTabName = 'Repair Needed';
        } else if (alertType == 'BrokenGauge') {
            selectedTabName = 'Broken PSI Gauge';
        } else if (alertType == 'MissingGauge') {
            selectedTabName = 'Missing PSI Gauge';
        }else if (alertType == 'Other') {
            selectedTabName = 'Other Issue';
        }
        return selectedTabName;
    };
    $scope.getAlertTabName = function(alertType) {       
        $scope.selectedTabName = '';
        if(alertType != 'BrokenGauge' || alertType != 'MissingGauge'){
            $scope.gaugeDescription = '';
        }
        
        if (alertType == 'WaterLevelLow') {
            $scope.selectedTabName = 'Water Level Low';
        } else if (alertType == 'GreenPool') {
            $scope.selectedTabName = 'Algae';
        } else if (alertType == 'NoPower') {
            $scope.selectedTabName = 'No Power';
        } else if (alertType == 'SystemDown') {
            $scope.selectedTabName = 'System Down';
        } else if (alertType == 'NoAccess') {
            $scope.selectedTabName = 'No Access';
        } else if (alertType == 'Weather') {
            $scope.selectedTabName = 'Weather';
        } else if (alertType == 'RepairNeeded') {
             $scope.selectedTabName = 'Repair Needed';
        } else if (alertType == 'Other') {
            $scope.selectedTabName = 'Other Issue';
        }else if (alertType == 'BrokenGauge') {
            $scope.selectedTabName = 'Broken PSI Gauge';
            $scope.gaugeDescription = "Technician is reporting that the pressure gauge for the main filtration pump is broken. The ability to obtain a proper PSI reading is necessary for flow monitoring";

        } else if (alertType == 'MissingGauge') {
            $scope.selectedTabName = 'Missing PSI Gauge';
            $scope.gaugeDescription = "Technician is reporting that the pressure gauge for the main filtration pump is missing/not present. The ability to obtain a proper PSI reading is necessary for flow monitoring";;
        }
        
        return $scope.selectedTabName;
    };
    $scope.openedIssueType = '';
    $scope.openedJobId = 0;
    //to display alert tabs on click
    $scope.alertTimeout = false;
    $scope.alertsIssueTabs = function(jobObj, issueObj, openedIssueType) {
      
        $scope.dismissAlertSettingError = false;
        if($scope.alertTimeout)
        {
            $scope.successOveride = '';
            clearTimeout($scope.alertTimeout);
            $scope.alertTimeout = false;
        }
        $scope.confirmOpen = false;
        $scope.overRide = false;
        $scope.openedIssueType = openedIssueType;
        $scope.issueObj = issueObj;
        if ($scope.issueObj != undefined) {
            $scope.selectedAlertIssueId = (openedIssueType == 'client') ? issueObj.alertIssueId : issueObj.systemIssueId;
        } else {
            $scope.selectedAlertIssueId = 0;
        }
        if (!$scope.openedJobId || $scope.openedJobId != jobObj.addressId) {
            if ($scope.actionFrom == 'iconClick') {
                var actionName = "";
                var alertTitle = issueObj.title != undefined ? issueObj.title : $scope.setTitle(issueObj.type);
                actionName += "Page - Remote data monitoring\n";
                actionName += "Action - " + alertTitle + " alert expanded\n";
                $rootScope.addAuditLog($scope.dataId, actionName, 'remoteData');
            }
            $scope.openJobDetails(jobObj, 'iconClick');
        } else {
            if ($scope.actionFrom == 'iconClick') {
                var actionName = "";
                var alertTitle = issueObj.title != undefined ? issueObj.title : $scope.setTitle(issueObj.type);
                actionName += "Page - Remote data monitoring\n";
                actionName += "Action - " + alertTitle + " alert expanded\n";
                $rootScope.addAuditLog($scope.dataId, actionName, 'remoteData');
            }
        }
    };
    $scope.openJobDetails = function(jobObj, actionFrom) {
        $scope.actionFrom = actionFrom || 'direct';
        var addressId = jobObj.addressId;
        var c = 0;
        angular.forEach(jobObj.alerts, function(value) {
            if (value.issue.length > 0) {
                c = 1;
            }
        });
        if (c == 0) {
            $scope.issueObj = false;
        }
        if ($scope.openedJobId == addressId) {
            $scope.openedIssueType = '';
            $scope.selectedAlertIssueId = '';
            $scope.openedJobId = '';
            $scope.issueObj = '';
            return false;
        }
        $scope.openedJobId = jobObj.addressId;
        $scope.getJobDetails(jobObj.addressId);
    };
    $scope.showDot = [];
    $scope.showDot['client'] = [];
    $scope.showDot['system'] = [];
    $scope.checkConfirmOverRide = function(issueObj, issueType) {
        var issueId = (issueType == 'client') ? issueObj.alertIssueId : issueObj.systemIssueId;
        $scope.showDot[issueType][issueId] = true;
        if (checkConfirmDetail(issueObj.confirmDetail) || (issueObj.overrideNote != null && issueObj.overrideNote != '')) {
            $scope.showDot[issueType][issueId] = false;
        }
    };
    var checkConfirmDetail = function(confirmDetail) {
        if (confirmDetail != '' && confirmDetail != undefined) {
            confirmDetail = (typeof(confirmDetail) === 'object') ? confirmDetail : JSON.parse(confirmDetail);
            if (!confirmDetail || confirmDetail === '') {
                return false;
            }
            if (confirmDetail.scheduleVisit !== '' && confirmDetail.contactCustomer !== '' && confirmDetail.discipliniaryAction !== '' && confirmDetail.contactPoolTech !== '') {
                return true;
            }
        }
        return false;
    };
    $scope.checkConfirmDetail = checkConfirmDetail;
    //to parse job Details data accroding to client and system type
    $scope.parseJobDetails = function(jobDetails) {
        var alertsIssueArray = [];
        var alertsAssetsArray = {};
        alertsIssueArray['client'] = [];
        alertsIssueArray['system'] = [];
        var issueObj = "";
        var alertType = "system";
        angular.forEach(jobDetails.alerts, function(parentElement) {
            if (parentElement.issue.length > 0) {
                angular.forEach(parentElement.issue, function(element, key) {

                    if(!issueObj && key == 0){
                      issueObj = element
                      alertType = 'client';
                    }
                    try {
                        if (element.confirmDetail) {
                            element.confirmDetail = (typeof element.confirmDetail == 'string') ? JSON.parse(element.confirmDetail) : element.confirmDetail;
                        } else {
                            element.confirmDetail = {
                                scheduleVisit: false,
                                contactCustomer: false,
                                discipliniaryAction: false,
                                contactPoolTech: false
                            };
                        }
                    } catch (error) {
                        element.confirmDetail = {
                          scheduleVisit: false,
                          contactCustomer: false,
                          discipliniaryAction: false,
                          contactPoolTech: false
                        };
                    }
                    if (typeof alertsIssueArray[element.alertIssueId] == 'undefined') {
                        alertsIssueArray[element.alertIssueId] = [];
                    }
                    element.customNote2 = element.customNote;
                    alertsIssueArray['client'][element.alertIssueId] = element;
                    alertsAssetsArray[element.alertIssueId] = parentElement.assets;
                });
            }
            if (parentElement.systemIssue.length > 0) {
                angular.forEach(parentElement.systemIssue, function(element, key) {
                    try {
                      if(!issueObj && key == 0){
                        issueObj = element;
                      }
                        if (element.confirmDetail) {
                            element.confirmDetail = (typeof element.confirmDetail == 'string') ? JSON.parse(element.confirmDetail) : element.confirmDetail;
                        } else {
                            element.confirmDetail = {
                              scheduleVisit: false,
                              contactCustomer: false,
                              discipliniaryAction: false,
                              contactPoolTech: false
                            };
                        }
                    } catch (error) {
                        element.confirmDetail = {
                          scheduleVisit: false,
                          contactCustomer: false,
                          discipliniaryAction: false,
                          contactPoolTech: false
                        };
                    }
                    if (typeof alertsIssueArray[element.systemIssueId] == 'undefined') {
                        alertsIssueArray[element.systemIssueId] = [];
                    }
                    element.customNote2 = element.customNote;
                    alertsAssetsArray[element.systemIssueId] = parentElement.assets;
                    alertsIssueArray['system'][element.systemIssueId] = element;


                });
            }
        });

        $scope.alertsIssueTabs(jobDetails, issueObj, alertType);
        jobDetails.alertsIssueArray = alertsIssueArray;
        jobDetails.alertsAssetsArray = alertsAssetsArray;
        $scope.jobDetails = jobDetails;
        setTimeout(function() {
            try {
                if ($scope.actionFrom != 'iconClick') {
                    document.querySelector("#issues-tabs-" + jobDetails.deviceWaterBodyId + " > div > a:first-of-type").click();
                }
            } catch (error) {}
        }, 100);
    };
    $scope.alertConfirmModel = {
      scheduleVisit: false,
      contactCustomer: false,
      discipliniaryAction: false,
      contactPoolTech: false
    };
    $scope.startDate = '';
    //to get job details by jobid
    $scope.getJobDetails = function(waterguruDataId, actionFrom, isInstall=false) {
        $scope.job = [];
        if (!waterguruDataId) {
            return
        }
        if ($rootScope.userSession) {
            var userId = $rootScope.userSession.id;
            $scope.isProcessing = true;
            apiGateWay.get("/waterguru_data_details", { waterguruDataId: $scope.dataId}).then(function(response) {
                if (response.data.status == 200) {
                    var jobDetails = response.data.data;
                    jobDetails.createTime = (jobDetails.measurementTime && jobDetails.measurementTime != '') ? jobDetails.measurementTime : jobDetails.createdOn ? jobDetails.createdOn: null;
                    jobDetails.measurementTime = (jobDetails.measurementTime && jobDetails.measurementTime != '') ? moment(jobDetails.measurementTime).format('MM/DD/YYYY'): null;
                    jobDetails.createdOn = (jobDetails.createdOn && jobDetails.createdOn != '') ? moment(jobDetails.createdOn).format('MM/DD/YYYY'): null;
                    $scope.job = jobDetails;
                    // $rootScope.showCaptionInCustomerEmail = jobDetails.showCaption;
                    if(jobDetails.serviceManagerId == 0)
                    {
                        $rootScope.addUpdateManager("add", $scope.dataId, 'remoteData');
                    }
                    service.jobDetails[$scope.dataId] = jobDetails;
                    if (jobDetails.managerProfileImage != '') {
                        $scope.managerProfileImage = jobDetails.managerProfileImage;
                    }

                    $scope.serviceManagerName = jobDetails.serviceManagerName;
                    $scope.serviceManagerFirstName = jobDetails.serviceManagerFirstName;
                    $scope.serviceManagerLastName = jobDetails.serviceManagerLastName;
                    
                    // $scope.technicianName = jobDetails.technicianName;
                    // $scope.technicianFirstName = jobDetails.technicianFirstName;
                    // $scope.technicianLastName = jobDetails.technicianLastName;
                    $scope.parseJobDetails(jobDetails, actionFrom);
                    
                } else if (response.data.status == 203) {
                    $state.go("app.customerdetail", {
                        addressId: $scope.addressId
                    });
                }
                $scope.isProcessing = false;
            });
        }
    };
    $scope.showPieGraph = function(e,type){
      $scope.alertTrendGrpaphType = type
    }
    //to get job images
    $scope.jobImages = function(subJobId) {
        if (subJobId) {
            $scope.isProcessing = true;
            apiGateWay.get("/job_images", {
                waterBodyId: subJobId
            }).then(function(response) {
                if (response.data) {
                    if (response.data.status == 200) {
                        if(response.data.data.length > 0){
                            var imagesData = response.data.data
                            var slidesArray = [];
                            var extraArray = [];
                            var slideKeyArray = [];
                            var i = 1;
                            var j = 1;
                            angular.forEach(imagesData, function(element, index){
                                if(["Before", "After","No Access"].indexOf(element.assetsType) == -1 && j<3){
                                    extraArray.push(element);
                                    j = j+1;
                                }
                              
                              if(["Before", "After"].indexOf(element.assetsType) != -1 && slideKeyArray.indexOf(element.assetsType) == -1){
                                  slidesArray.push(element);
                                  slideKeyArray.push(element.assetsType);
                              }
                              if(["No Access"].indexOf(element.assetsType) != -1 && i<3){
                                
                                slidesArray.push(element)
                                slideKeyArray.push(element.assetsType);
                                i = i+1;
                            }
                           
                            });
                            $scope.slides = [];
                            $scope.slides = slidesArray;
                            if(slidesArray.length==0){
                                $scope.slides = extraArray;
                            }else if(slidesArray.length==1){
                                if(extraArray.length>0){
                                    $scope.slides.push(extraArray[0]);
                                }
                                
                            }
                        }else{
                          $scope.slides = crowlerPlaceHolderImages;
                        }
                    }
                }
                $scope.isProcessing = false;
            });

            apiGateWay.get("/job_images", {
                deviceWaterBodyId: subJobId,
                type:'video'
            }).then(function(response) {
                if (response.data) {
                    if (response.data.status == 200) {
                        if(response.data.data.length > 0){
                            $scope.video = response.data.data[0];
                        }else{
                          $scope.video = false;
                        }
                    }
                }
                $scope.isProcessing = false;
            });
        }
    }
        if ($rootScope.socket) {
        $rootScope.socket.on("manager_response", function(data) {
            if (data['success']) {
                if($scope.deviceWaterBodyId == data['deviceWaterBodyId'])
                {
                    if ($scope.showLoader == false) {
                        $scope.showLoader = true;
                        if (!$scope.$$phase) $scope.$apply();
                    }
                    if (data['jobAction'] == 'remove') {
                        $scope.managerProfileImage = '';
                        $scope.serviceManagerName = "";


                    }
                    if (data['jobAction'] == 'add') {
                        $scope.managerProfileImage = '';
                        if(data['managerData']['managerImage'])
                        {
                            $scope.managerProfileImage = data['managerData']['managerImage'];
                        }
                        $scope.serviceManagerName = data['managerData']['managerName'];
                    }
                    $scope.showLoader = false;
                }

            }

        });
    }
    $scope.overridenModel = [];
    // to save custom notes
    $scope.saveCustomNote = function(event) {
        if (event.target.value && ($scope.customerNote != event.target.value)) {
            apiGateWay.send("/update_alert", {
                issueId: $scope.selectedAlertIssueId,
                custumNote: event.target.value,
                issueType: $scope.openedIssueType,
                type: 'custom'
            }).then(function() {
                $scope.isProcessing = false;
                // $scope.customerNote = event.target.value;
                $scope.jobDetails.alertsIssueArray[$scope.openedIssueType][$scope.selectedAlertIssueId].customNote2 = event.target.value;
                $scope.successCustomNote = 'Note has been successfully saved.';
                $scope.dismissAlertSettingError = false;
                setTimeout(function() {
                    $scope.successCustomNote = '';
                    
                }, 2000);
                var analyticsData = {};
                analyticsData.userData = $rootScope.userSession;
                analyticsData.data = {
                    "deviceWaterBodyId": $scope.openedJobId,
                    "customeNote": event.target.value,
                    "issueId": $scope.selectedAlertIssueId
                };
                analyticsData.actionTime = new Date();
                var analyticsDataString = JSON.stringify(analyticsData);
                var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
                $rootScope.storeAnalytics('Alerts - Custom Note', "Alerts - Submit Custom Note AddressId - " + $scope.openedJobId + " - " + currentDateTime, analyticsDataString, 0, true);
            }, function(error) {
                $scope.errorCustomNote = error;
                setTimeout(function() {
                    $scope.errorCustomNote = '';
                }, 2000);
                $scope.isProcessing = false;
                var analyticsData = {};
                analyticsData.requestData = {
                    issueId: $scope.selectedAlertIssueId,
                    custumNote: event.target.value,
                    issueType: $scope.openedIssueType,
                    type: 'custom'
                };
                analyticsData.userData = $rootScope.userSession;
                analyticsData.actionTime = new Date();
                analyticsData.errorData = error;
                var analyticsDataString = JSON.stringify(analyticsData);
                var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
                $rootScope.storeAnalytics('Error - Custom Note', "Error on Save Custom Note - " + currentDateTime, analyticsDataString, 0, true);
            });
        }
    };
    $scope.auditLogList = [];
    $scope.totalRecord = 0;
    $scope.totalPage = 0;
    $scope.getAuditLog = function(isOpen) {
        isOpen = isOpen || 0;
        if (isOpen == 1) {
            $scope.currentPage = 1;
        }
        $scope.isProcessing = true;
        apiGateWay.get("/device_audit_logs", {
            offset: $scope.currentPage - 1,
            limit: $scope.limit,
            waterDeviceDataId: $scope.dataId
        }).then(function(response) {
            if (response.data.status == 200) {
                var listResponse = response.data.data;
                $scope.totalRecord = listResponse.rows;
                $scope.totalPage = $scope.totalRecord % $scope.limit !== 0 ? parseInt($scope.totalRecord / $scope.limit) : parseInt($scope.totalRecord / $scope.limit) - 1;
                $scope.auditLogList = listResponse.data;
            } else {
                $scope.auditLogList = [];
            }
            if (isOpen == 1) {
                ngDialog.open({
                    template: "templates/auditLogList.html",
                    className: "ngdialog-theme-default",
                    scope: $scope,
                    closeByDocument: false,
                    preCloseCallback: function() {}
                });
            }
            $scope.isProcessing = false;
        }, function(error) {
            var analyticsData = {};
            analyticsData.requestData = {
                offset: $scope.currentPage - 1,
                limit: $scope.limit,
                userNameORAddress: $scope.userNameORAddress
            };
            analyticsData.userData = $rootScope.userSession;
            analyticsData.actionTime = new Date();
            analyticsData.errorData = error;
            var analyticsDataString = JSON.stringify(analyticsData);
            var currentDateTime = $filter("date")(new Date(), "MM/dd/yyyy hh:m:ss a");
            $rootScope.storeAnalytics("Error - Get Audtit Log List", "Error on getAuditLog - " + currentDateTime, analyticsDataString, 0, true);
        });
    }
    $scope.openAuditLog = function() {
        $scope.getAuditLog(1);
    };
    $scope.goToPage = function(page) {
        $scope.currentPage = page;
        $scope.getAuditLog();
    };
    window.mobilecheck = function() {
      var check = false;
      (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
      return check;
    };
    $scope.callCustomer = function(phoneNo){
        var actionName = "";
        actionName += "Page - Remote data monitoring\n";
        actionName += "Action - Customer phone number clicked\n";
        $rootScope.addAuditLog($scope.dataId, actionName, 'remoteData');
        if(window.mobilecheck()){
            document.location.href = 'tel:' + phoneNo;
        }
    };
    $scope.successMail = false;
    $scope.errorMail = false;
    $scope.mailPdf = function(email) {
        var actionName = "";
        actionName += "Page - Remote data monitoring\n";
        actionName += "Action - Email summary pdf button clicked\n";
        $rootScope.addAuditLog($scope.dataId, actionName, 'remoteData');
        $scope.isProcessing = true;
        apiGateWay.send("/email_pdf", {
            deviceWaterBodyId: $scope.deviceWaterBodyId,
            arrivalTime:$filter('date')(new Date($scope.jobDetails.jobAssignTime), "hh:m a"),
            email: $scope.sentEmailSummaryEmail
        }).then(function(response) {
            if (response.status == 200) {
                $scope.emailSummaryPopup.close();
                $scope.successMail = response.data.message;
            } else {
                $scope.errorMail = response.data.message;
            }
            setTimeout(function() {
                $scope.successMail = false;
                $scope.errorMail = false;
            }, 2000);
            $scope.isProcessing = false;
        }, function(error) {
            $scope.errorMail = error;
            $scope.isProcessing = false;
            setTimeout(function() {
                $scope.successMail = false;
                $scope.errorMail = false;
            }, 2000);
        });
    }
    $scope.multipleEmailRegex = /^(([^<>()[\]\\,;:\%#^\s@\"$&!@]+@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z0-9\d-_]+\.)+[a-zA-Z\d-_]{2,}))),\s*)*([^<>()[\]\\,;:\%#^\s@\"$&!@]+@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z0-9\d-_]+\.)+[a-zA-Z\d-_]{2,})))$/;
    $scope.sentEmailSummaryEmail = '';
    $scope.emailSummaryPopup =  null;
    $scope.openEmailSummaryPopup = function() {
        let email = $scope.customerinfo.customer.primaryEmail ? $scope.customerinfo.customer.primaryEmail : $scope.customerinfo.customer.email;
        $scope.sentEmailSummaryEmail = angular.copy(email);       
        $scope.emailSummaryPopup = ngDialog.open({
            template: 'emailSummaryPopup.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function() {  
                $scope.sentEmailSummaryEmail = '';
            }
        });      
    }
    $scope.submitEmailSummaryForm = function() {
        if ($scope.getMultipleEmailValidationStatus()) {
            $scope.mailPdf()
        }
    }
    $scope.updateEmailSummaryMails = function(e) {
        $scope.sentEmailSummaryEmail = e.sentEmailSummaryEmail;
    }
    $scope.getMultipleEmailValidationStatus = function() {
        let emailRegex = /^[^<>()[\]\\,;:\%#^\s@\"$&!@]+@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z0-9\d-_]+\.)+[a-zA-Z\d-_]{2,}))$/;
        let isValid = true; // Assume valid unless proven otherwise
        let emailInput = document.querySelector('#sentEmailSummaryEmail');
        let errorBox = document.querySelector('#validationMessageRouteStopEmail');
        let emailValue = emailInput.value;
        emailInput.classList.remove('has-error');
        errorBox.innerHTML = '';
        if (!emailValue) {
            isValid = false;
            errorBox.innerHTML = 'Please enter an email address';
            emailInput.classList.add('has-error');
        } else {
            let emailArray = emailValue.split(',').map(email => email.trim());
            for (let email of emailArray) {
                if (!emailRegex.test(email)) {
                    isValid = false;
                    errorBox.innerHTML = 'Please enter valid email address';
                    emailInput.classList.add('has-error');
                    break;
                }
            }
        }
        return isValid;
    }
    $rootScope.rootOpenEmailSummaryPopup = function() {
        $scope.openEmailSummaryPopup()
    }
    $scope.dismissAlertSetting = {
        status:1,
        days:30,
        validateNotes:0,
    }
    $scope.getAdminAlertSetting = function(){  
        apiGateWay.send("/company_dismiss_alert_settings", {"true":1}).then(function(response) {
            if (response.data.status == 200) {
              if(response.data.data && response.data.data.length > 0){
                $scope.dismissAlertSetting = response.data.data[0];                
              }         
            }   
        }, function(error){
        })
    }
    $scope.getTimeFormatted = function(dtString) {
        if (dtString) {
            return moment(dtString).format('hh:mm A');
        }
    }
});
