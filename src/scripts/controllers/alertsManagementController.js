angular.module('POOLAGENCY')

.controller('alertsManagementController',  function($scope, $state, $rootScope, $filter, $sce, apiGateWay, service, ngDialog,Analytics, $timeout, auth) {

        $scope.customizeAlertsList = [];
        $scope.issueReportAlertsList = [];
        $scope.customizeCustomAlertsList = [];
        $scope.customizeAlertError = false;
        $scope.triggerModel = {"isSalt":2,"serviceLevel":{}, visits: null, frequencyType: 1, isRemoteMonitoringData: false };
        $scope.waterGuruAlerts = [];
        $scope.isProcessingWater = false;
        $scope.alertSelectedIndex = 0;
        $scope.isCustom = false;
        $scope.isWaterGuru = false;
        $scope.showWaterGuru = false;
        $scope.triggerModelError ='';
        $scope.emailAddress = [];
        $scope.alertKey = null;
        var emailAddressCopy = [];
        $scope.permissions = {};
        if (auth.getSession()) {
            $scope.permissions = auth.getSession();
        }
        $scope.addEmailAddressesModal = function(alertId, index, alertType) {
            $scope.alertId = alertId;
            $scope.alertIndex = index;
            $scope.alertType = alertType

            $scope.isProcessingSystem = true;
            $scope.isProcessingEmailAdd = false;
            apiGateWay.get("/company/email_on_alert", {alertId: $scope.alertId, alertType: $scope.alertType}).then(function(response){
                if(response.data.status == 200){
                    var responseData = response.data;   
                    
                    $scope.emailAddress = responseData && responseData.data && responseData.data.length > 0 ? responseData.data : [];
                    emailAddressCopy = angular.copy(responseData && responseData.data && responseData.data.length > 0 ? responseData.data : []);
                    $scope.addEmailAddressesModalIns = ngDialog.open({
                        template: 'addEmailAddresses.html',
                        className: 'ngdialog-theme-default v-center',
                        closeByNavigation: true,
                        closeByDocument: false,
                        scope: $scope,
                        preCloseCallback: function() {
                            $scope.alertId = '';
                            $scope.emailAddress = emailAddressCopy;
                            $scope.emailOnAlertValidationError = {};
                            $scope.emailOnAlertValidationSuccess = null;        
                            if($scope.emailAddress && $scope.emailAddress.length == 0){
                                if($scope.alertType == 'SYSTEM'){
                                  $scope.customizeAlertsList[$scope.alertIndex]['isEmailAlertOn'] = false;
                                }else if($scope.alertType == 'ISSUE'){
                                    $scope.issueReportAlertsList[$scope.alertIndex]['isEmailAlertOn'] = false;                               
                                }else if($scope.alertType == 'WATERGURU'){
                                    $scope.waterGuruAlerts[$scope.alertIndex]['isEmailAlertOn'] = false;                               
                                }else{
                                  $scope.customizeCustomAlertsList[$scope.alertIndex]['isEmailAlertOn'] = false;
                                }
                            }else{
                                if($scope.alertType == 'SYSTEM'){
                                    $scope.customizeAlertsList[$scope.alertIndex]['isEmailAlertOn'] = true;
                                }else if($scope.alertType == 'ISSUE'){
                                    $scope.issueReportAlertsList[$scope.alertIndex]['isEmailAlertOn'] = true;                               
                                }else if($scope.alertType == 'WATERGURU'){
                                    $scope.waterGuruAlerts[$scope.alertIndex]['isEmailAlertOn'] = true;                               
                                }else{
                                    $scope.customizeCustomAlertsList[$scope.alertIndex]['isEmailAlertOn'] = true;
                                }
                            }
                            $scope.alertIndex = null;
                            $scope.alertType = null;
                        }
                    });                      
                }
                $scope.isProcessingSystem = false;
            }, function(error){
                $scope.isProcessingSystem  = false;
            })
            
        };

        $scope.addEmailInput = function(){
            if($scope.emailAddress && $scope.emailAddress.length <= 10){
                $scope.emailAddress.push({email: '', alertId: $scope.alertId, emailOnAlertId: null});
            }
        }

        $scope.removeEmailInput = function(emailOnAlertId, index){
            if($scope.emailAddress && $scope.emailAddress.length > 0 && emailOnAlertId){
                $scope.deleteIndex = index;
                $scope.emailOnAlertId = emailOnAlertId;
                $scope.deleteEmailModal = ngDialog.open({
                    template: 'deletEmailFromCustomAlertConfirm.html',
                    className: 'ngdialog-theme-default v-center',
                    overlay: true,
                    closeByDocument: false,
                    closeByNavigation: true,
                    scope: $scope,
                    preCloseCallback: function () {
                        
                      $scope.deleteIndex = '';
                      $scope.emailOnAlertId = null;                      
                    }
                });
            }else{
                if($scope.emailAddress && $scope.emailAddress.length > 0 && !$scope.emailAddress[index].email){
                    $scope.emailAddress.splice(index, 1);
                }
            }
        }
        $scope.closeDeleteEmailModal = function(){
            $scope.deleteEmailModal.close()
        };

        $scope.confirmEmailCustomAlertAction = function(){
            var index = $scope.deleteIndex;
            if($scope.emailOnAlertId){
                // api call to remove from db  
                $scope.isProcessingEmailAdd = true;              
                apiGateWay.send("/company/delete_email_on_alert", {emailOnAlertId: $scope.emailOnAlertId}).then(function(response){
                    if(response.data.status == 200){
                        $scope.emailAddress.splice(index, 1);
                        emailAddressCopy.splice(index, 1);
                    }
                    $scope.isProcessingEmailAdd = false;
                }, function(error){
                    $scope.emailOnAlertValidationError[index] = error;
                    setTimeout(function(){
                        $scope.emailOnAlertValidationError[index] = null;
                    }, 3000)
                    $scope.isProcessingEmailAdd = false;
                })
            
            }else{
                $scope.emailAddress.splice(index, 1);
            }
            $scope.closeDeleteEmailModal();
        }

        $scope.emailOnAlertValidationError = {}
        $scope.emailOnAlertValidationSuccess = null;
        $scope.addEmailOnAlert = function(email, index, emailOnAlertId){
            if(!email || email.length < 6 || !(/^[^<>()[\]\\,;:\%#^\s@\"$&!@]+@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z0-9\d-_]+\.)+[a-zA-Z\d-_]{2,}))$/.test(email))){
                $scope.emailOnAlertValidationError[index] = 'Please enter valid email';
                setTimeout(function(){
                    $scope.emailOnAlertValidationError[index] = null;
                }, 3000)
                return false;
            }            
            
            if(emailAddressCopy[index] && emailAddressCopy[index].email == $scope.emailAddress[index].email){
                return false;
            }
            for(var i =0; i < $scope.emailAddress.length; i++){
                var emailAdd = $scope.emailAddress[i]
                if(index != i && email == emailAdd.email){
                    $scope.emailOnAlertValidationError[index] = "Duplicate email can\'t allow";
                    setTimeout(function(){
                        $scope.emailOnAlertValidationError[index] = null;
                    }, 3000)
                    return false;
                }
            }            
            $scope.isProcessingEmailAdd = true;
            apiGateWay.send("/company/email_on_alert", {email, alertId: $scope.alertId, emailOnAlertId, alertType: $scope.alertType}).then(function(response){
                if(response.data.status == 200){
                      var responseData = response.data;
                      var resEmailOnAlertId = responseData.data.emailOnAlertId;
                      $scope.emailAddress[index].emailOnAlertId = resEmailOnAlertId;
                      $scope.emailAddress[index].id = resEmailOnAlertId;
                      if(!emailAddressCopy || !emailAddressCopy[index]){
                        emailAddressCopy[index] = {};
                      }
                      emailAddressCopy[index].email = email;
                      emailAddressCopy[index].alertId = $scope.alertId;
                      emailAddressCopy[index].emailOnAlertId = resEmailOnAlertId;
                      emailAddressCopy[index].id = resEmailOnAlertId

                      $scope.emailOnAlertValidationSuccess = responseData.message;
                      
                      setTimeout(function(){
                        $scope.emailOnAlertValidationSuccess = null;
                    }, 3000)
                }else{
                    $scope.emailOnAlertValidationError[index] = response.data.message;
                    setTimeout(function(){
                        $scope.emailOnAlertValidationError[index] = null;
                    }, 3000)
                }
                $scope.isProcessingEmailAdd = false;
            }, function(error){
                $scope.emailOnAlertValidationError[index] = error;
                setTimeout(function(){
                    $scope.emailOnAlertValidationError[index] = null;
                }, 3000)
                $scope.isProcessingEmailAdd = false;
            })
        }

        $scope.getCustomizeAlerts = function(){
            $scope.isProcessingSystem = true;
            apiGateWay.get("/company/customize_alerts?get=1", {}).then(function(response){
                if(response.data.status == 200){
                      var responseData = response.data.data;
                      $scope.customizeAlertsList = responseData['SYSTEM'];
                      $scope.customizeCustomAlertsList = responseData['CUSTOM'];
                      $scope.serviceLevelList = responseData['SERVICELEVEL'];
                      $scope.priorityLevelList = responseData['PRIORITYLEVEL'];
                      $scope.issueReportAlertsList =  responseData['ISSUEALERT'];
                      $scope.waterGuruAlerts = responseData['WATERGURU'];
                      $scope.alertSelectedIndex = 0;
                      $scope.isCustom = false;
                }
                $scope.isProcessingSystem = false;
            }, function(error, status){
                $scope.customizeAlertError = error;
                $scope.isProcessingSystem = false;
            })
        }

        $scope.addTrigger = function(serviceLevel,isSalt,index,custom=false, visits=0, alertKey, alertObj = null) {
            $scope.alertSelectedIndex = index;
            $scope.isCustom = custom;
            $scope.alertKey = alertKey != null ? alertKey : null;
            $scope.triggerModel['isSalt']= isSalt;
            if (visits != null && visits > 1) {
                 $scope.triggerModel.visits = Number(visits);
                 $scope.triggerModel.frequencyType = 2;
            } else {
                $scope.triggerModel.visits = visits;
                $scope.triggerModel.frequencyType = 1;
            }
            if (alertKey == 'PSI_TRENDING_DOWN' || alertKey == 'SALT_TRENDING_DOWN') {
                $scope.triggerModel.frequencyType = 1;
                $scope.triggerModel.visits = 1;
            }
            if(serviceLevel){
                serviceLevelArray = serviceLevel.split(",");
                angular.forEach($scope.serviceLevelList, function(element, index){
                    if (element && serviceLevelArray.indexOf(element.id.toString()) != -1) {  
                        $scope.triggerModel['serviceLevel'][element.id] = true;
                    }else{
                        $scope.triggerModel['serviceLevel'][element.id] = false;
                    }
                })
            }else{
                angular.forEach($scope.serviceLevelList, function(element, index){
                    if (element) {  
                        $scope.triggerModel['serviceLevel'][element.id] = true;
                    }
                })
            }
            
            if (alertObj !== null) {
                $scope.showWaterGuru = alertObj.showRemoteMonitoringData ? true : false;
                $scope.triggerModel['isRemoteMonitoringData'] = alertObj.isRemoteMonitoringData;
                $scope.isWaterGuru = alertObj.alertType && alertObj.alertType == 'WATERGURU' ? true : false;
            } else {
                $scope.showWaterGuru = false;
            }
            
            $scope.addTriggerModal = ngDialog.open({
                template: 'addTriggerTemplate.html',
                className: 'ngdialog-theme-default v-center',
                closeByNavigation: true,
                scope: $scope,
                preCloseCallback: function() {
                    $scope.triggerModelError = '';
                }
            });
        };        

        $scope.closeTriggerModal = function(){
            if($scope.addTriggerModal) $scope.addTriggerModal.close();
            if($scope.addEmailAddressesModalIns) $scope.addEmailAddressesModalIns.close();
        }

        


        $scope.convertIntoTime = function(numValue){
              return ((numValue/12) > 1) ? (numValue%12 == 0 ? '12' : numValue%12 )+':00 pm' : numValue+':00 am'
        }

        $scope.parseTimeForLatStart = function(index, value, type){
            value = isNaN(parseFloat(value)) ? '0:00' : parseFloat(value).toFixed(2).toString().replace('.', ':');
            var dateInstance = new Date();
            var datestr = $filter('date')(dateInstance, 'MM-dd-yyyy')
            datestr = datestr+' '+value+':00';

            if(type && type=='custom'){
              $scope.customizeCustomAlertsList[index].triggerValueMoc = datestr;
            }else{
              $scope.customizeAlertsList[index].triggerValueMoc = datestr;
            }
          }
          $scope.openLateAlertDatePicker = () => {
            $timeout(() => {
                var t = document.getElementsByClassName('datetimepicker-icon-clicker-target')[0];
                if (t) {
                  t.click();
                }
              }, 0);  // 0 delay ensures it runs after the current digest cycle
          }
          $scope.lateStartOnChange = function(value, index, type){
            if(value){
                var triggertime =$filter('date')(value.toDate(), 'HH:mm');
                if(type=='custom'){
                  $scope.customizeCustomAlertsList[index].triggerValue = triggertime.replace(':', '.');
                  $scope.submitCustomAlert()
                }else{
                  $scope.customizeAlertsList[index].triggerValue = triggertime.replace(':', '.');
                  $scope.submitSystemAlertForm();
                }
            }
          }

        $scope.dateTimePickerOption = {format: 'hh:mm a', showClear: false};

        $scope.visitsArray = new Array(12);
        $scope.parseSelectOptions = function(stringArray){
            stringArray = JSON.parse("[" + stringArray + "]")
            return stringArray[0];
        }
        $scope.getCustomizeAlerts();

        $scope.parseTriggerOnValue = function(rowObj, index, modelName){
            var values = 0;
            if(rowObj.isSalt){values=values=1}
            if(rowObj.isChemical){values=values=1}
            if(rowObj.isAllOthers){values=values=1}
            values = values > 0 ? values : '';
            $scope.customizeAlertsList[index][modelName] = values;
        }
        $scope.parseTriggerOnValueOnCustomAlert = function(rowObj, index, modelName){
            var values = 0;
            if(rowObj.isSalt){values=values=1}
            if(rowObj.isChemical){values=values=1}
            if(rowObj.isAllOthers){values=values=1}
            values = values > 0 ? values : '';
            $scope.customizeCustomAlertsList[index][modelName] = values;
        }

        $scope.setLateTime = function(alertKey, index, selectedTime){
            var customizeAlertsList = angular.copy($scope.customizeAlertsList);

            var lateTime = new Date();
            if(alertKey=='LATE_START'){
              lateTime.setHours(selectedTime);
              lateTime.setMinutes(0);
              lateTime.setSeconds(0);
            }
            $scope.customizeAlertsList[index].lateTime = lateTime;
        }

        var intervalIns = '';
        $scope.submitSystemAlertForm = function(){
          if(intervalIns){ clearTimeout(intervalIns);}
        //   intervalIns = setTimeout(function(){document.getElementById('systemAlertSubmit').click();}, 2000)
        intervalIns = setTimeout(function(){$scope.updateSyatemAlerts(true);}, 2000)
        }
        var issueintervalIns = '';
        $scope.submitIssueAlertForm = function(){
            if(issueintervalIns){ clearTimeout(issueintervalIns);}
            issueintervalIns = setTimeout(function(){document.getElementById('issueAlertSubmit').click();}, 200)
          }
        
          $scope.updateIssueAlerts = function(){
            $scope.issueAlertErrorMessage = false;
            $scope.isProcessingIssueAlert = true;
            apiGateWay.send("/company/issue_alerts", {"postData": $scope.issueReportAlertsList}).then(function(response){
                if(response.data.status == 200){
                      var responseData = response.data.data;
                }else{
                  $scope.issueAlertErrorMessage = response.data.message;
                }
                $scope.isProcessingIssueAlert = false;
            }, function(error){
                $scope.issueAlertErrorMessage = error;
                $scope.isProcessingIssueAlert = false;
            })
        }


        $scope.clearInterval = function(){
          if(intervalIns){clearTimeout(intervalIns);}
        }
        $scope.updateAlertTrigger = function(lastIndex){
                $scope.triggerModelError = "";
                var saltStatus= true;
                var slStatus = true;
                var cutomizeAlertModel='';
                if($scope.isCustom){
                    cutomizeAlertModel = $scope.customizeCustomAlertsList;
                } else if($scope.isWaterGuru) {
                    cutomizeAlertModel = $scope.waterGuruAlerts;
                }else{
                    cutomizeAlertModel = $scope.customizeAlertsList;
                }
                if($scope.triggerModel.isSalt==2){   
                    saltStatus = true;
                }else{ 
                    saltStatus = false;
                }
                cutomizeAlertModel[lastIndex]['isSalt'] = $scope.triggerModel.isSalt;
                cutomizeAlertModel[lastIndex]['isRemoteMonitoringData'] = $scope.triggerModel.isRemoteMonitoringData;
                if($scope.triggerModel.serviceLevel){
                    var slIds = [];
                    var unchekcount = 0;
                    angular.forEach($scope.triggerModel.serviceLevel, function(value, key) {
                        if(value){
                            this.push(key);
                        }else{
                            unchekcount = unchekcount+1;
                            slStatus = false;
                        }
                      },slIds);

                     cutomizeAlertModel[lastIndex]['serviceLevel']  = slIds.join();
                     if(Object.keys($scope.triggerModel.serviceLevel).length == unchekcount){
                        $scope.triggerModelError = "Must select at least one service level or this alert will never trigger. To disable the alert, use the active/inactive switch.";
                        return;
                     } 
                     
                }
                if(saltStatus && slStatus){
                    cutomizeAlertModel[lastIndex]['serviceLevel']  = "";
                    cutomizeAlertModel[lastIndex]['triggerStatus'] = "all";
                }else{
                    cutomizeAlertModel[lastIndex]['triggerStatus'] = "custom";
                }
                
                $scope.closeTriggerModal();
                if($scope.isCustom){
                    setTimeout(function(){document.getElementById('customAlertSubmit').click();}, 1000);
                }else if($scope.isWaterGuru){
                    setTimeout(function(){document.getElementById('waterGuruFormSubmit').click();}, 1000);
                }else{
                    setTimeout(function(){document.getElementById('systemAlertSubmit').click();}, 1000);
                }
                
             
        }

        
        $scope.updateSyatemAlerts = function(isToggle = false){
            $scope.clearInterval();
            $scope.customizeAlertErrorMessage = false;
            $scope.isProcessingSystem = true;
            if (!isToggle) {
                $scope.customizeAlertsList[$scope.alertSelectedIndex].visits = ($scope.triggerModel.visits != null) ? $scope.triggerModel.visits : 1;
                let isDeviceActive = $scope.customizeAlertsList[$scope.alertSelectedIndex].showRemoteMonitoringData && $scope.customizeAlertsList[$scope.alertSelectedIndex].isRemoteMonitoringData ? true : false;
                if ($scope.triggerModel.visits == 1 && Number($scope.customizeAlertsList[$scope.alertSelectedIndex].isSalt) == 2 && $scope.customizeAlertsList[$scope.alertSelectedIndex].serviceLevel == '' && isDeviceActive) {
                  $scope.customizeAlertsList[$scope.alertSelectedIndex].triggerStatus = "all";
                } else {
                  $scope.customizeAlertsList[$scope.alertSelectedIndex].triggerStatus = "custom";
                }
            }
            apiGateWay.send("/company/customize_alerts?get=1", {"postData": $scope.customizeAlertsList, "type": "SYSTEM"}).then(function(response){
                if(response.data.status == 200){
                      var responseData = response.data.data;
                }else{
                  $scope.customizeAlertErrorMessage = response.data.message;
                }
                $scope.isProcessingSystem = false;
            }, function(error){
                $scope.customizeAlertError = error;
                $scope.isProcessingSystem = false;
            })
        }
        
        $scope.updateWaterGuruAlerts = function(isToggle = false){
            $scope.clearInterval();
            $scope.customizeAlertErrorMessage = false;
            $scope.isProcessingWater = true;
            if (!isToggle) {
                $scope.waterGuruAlerts[$scope.alertSelectedIndex].visits = ($scope.triggerModel.visits != null) ? $scope.triggerModel.visits : 1;
                if ($scope.triggerModel.visits == 1 && Number($scope.waterGuruAlerts[$scope.alertSelectedIndex].isSalt) == 2 && $scope.waterGuruAlerts[$scope.alertSelectedIndex].serviceLevel == '') {
                    if ($scope.waterGuruAlerts[$scope.alertSelectedIndex].showRemoteMonitoringData) {
                        if ($scope.waterGuruAlerts[$scope.alertSelectedIndex].isRemoteMonitoringData) {
                            $scope.waterGuruAlerts[$scope.alertSelectedIndex].triggerStatus = "all";
                        } else {
                            $scope.waterGuruAlerts[$scope.alertSelectedIndex].triggerStatus = "custom";
                        }
                    } else {
                        $scope.waterGuruAlerts[$scope.alertSelectedIndex].triggerStatus = "all";
                    }
                } else {
                  $scope.waterGuruAlerts[$scope.alertSelectedIndex].triggerStatus = "custom";
                }
            }
            apiGateWay.send("/company/customize_alerts?get=1", {"postData": $scope.waterGuruAlerts, "type": "WATERGURU"}).then(function(response){
                if(response.data.status == 200){
                      var responseData = response.data.data;
                }else{
                  $scope.customizeAlertErrorMessage = response.data.message;
                }
                $scope.isProcessingWater = false;
            }, function(error){
                $scope.customizeAlertError = error;
                $scope.isProcessingWater = false;
            })
        }
        
        $scope.submitWaterGuruForm = function(){
            if(intervalIns){ clearTimeout(intervalIns);}
            intervalIns = setTimeout(function(){$scope.updateWaterGuruAlerts(true);}, 2000);
        }


        $scope.resetToDefaultConfirm = function(){
            $scope.clearInterval();
            ngDialog.open({
                template: 'resetToDefaultConfirm.html',
                className: 'ngdialog-theme-default',
                closeByNavigation: true,
                scope: $scope,
                preCloseCallback: function () {
                }
            });
        }

        $scope.confirmResetAction = function(){
            $scope.closeModal();
            apiGateWay.send("/company/customize_alerts_reset", {}).then(function(response){
                if(response.data.status == 200){
                      var responseData = response.data.data;
                      $scope.getCustomizeAlerts();
                }else{
                  $scope.customizeAlertErrorMessage = response.data.message;
                }
                $scope.isProcessingSystem = false;
            }, function(error){
                $scope.customizeAlertError = error;
                $scope.isProcessingSystem = false;
            });
        }





        $scope.parameterOptions = ['Chlorine', 'pH', 'Alkalinity', 'CYA', 'Salt', 'Phosphates', 'TDS', 'PSI', 'Calcium', 'Water Temp'];
        $scope.conditionOption = [{'key': 'GREATER_THEN', 'value': 'Greater than'}, {'key': 'LESS_THEN', 'value':'Less than'}, {'key': 'EQUAL_TO', 'value': 'Equal to'}];

        $scope.getConditionValue = function(key){
            var returnVal = '';
            $scope.conditionOption.map(function(element){
                if(element.key==key){
                  returnVal = element.value;
                }
            });
            return returnVal;
        }


        $scope.addDuplicateRow = function(rowObj, from){
            var alertRowObj = angular.copy(rowObj);
            var condition = rowObj.conditionVal
            alertRowObj['id'] = 0;           
            alertRowObj['randomId'] = 'random_'+Math.floor(Math.random() * 9999999);
            alertRowObj['isEmailAlertOn'] = false;
            if(from == 'system'){
                alertRowObj['alertType'] = 'CUSTOM_SYSTEM';
                alertRowObj['parameter'] = alertRowObj['alertName'];
            }           
            $scope.customizeCustomAlertsList.push(alertRowObj);
            $scope.submitCustomAlert();
        }

        $scope.addCustomAlert = function(){
            var model = {
                "id": 0,
                "parameter": "pH",
                "conditionVal": "LESS_THEN",
                "status": 1,
                "color": "pink",
                "alertName": "",
                "alertType": "CUSTOM",
                "iconName": "pressure_gauge",
                "conditionSIgn": ">",
                "isSalt": 2,
                "serviceLevel": "",
                "triggerStatus": "all",
                "isChemical": true,
                "isAllOthers": true,
                "triggerValue": 0,
                "alertKey": "",
                "visits": 1,
                "priorityLevel":"NORMAL",
                "randomId": 'random_'+Math.floor(Math.random() * 9999999)
            }
            $scope.customizeCustomAlertsList.push(model);
        }

        var customChemical = {'Chlorine': 'green', 'pH': 'pink', 'Alkalinity': 'light_blue', 'CYA': 'dark_purple', 'Salt': 'dark_gray', 'Phosphates': 'dark_blue', 'TDS': 'dark_blue', 'PSI': 'dark_blue', 'Calcium': 'light_blue', 'Water Temp': 'light_blue'};
        var conditions = {'GREATER_THEN': 'full_test_tube', 'LESS_THEN': 'empty_test_tube', 'EQUAL_TO':'full_test_tube'};
        $scope.calculateIconColor = function(index){
            $scope.customizeCustomAlertsList[index]['color'] = customChemical[$scope.customizeCustomAlertsList[index].parameter];
            $scope.customizeCustomAlertsList[index]['iconName'] = conditions[$scope.customizeCustomAlertsList[index].conditionVal];
        }

        var customAlertInterval = '';
        $scope.submitCustomAlert = function(){
            if(customAlertInterval){ clearTimeout(customAlertInterval);}
            customAlertInterval = setTimeout(function(){$scope.saveCustomAlerts(true);}, 600)
        }

        $scope.clearCustomAlertInterval = function(){
          if(customAlertInterval){ clearTimeout(customAlertInterval);}
        }

        $scope.saveCustomAlerts = function(isToggle = false){
              $scope.clearCustomAlertInterval();
              $scope.customAlertErrorMessage = false;
              $scope.isProcessingCustom = true;
              if (!isToggle) {
                $scope.customizeCustomAlertsList[$scope.alertSelectedIndex].visits = ($scope.triggerModel.visits != null) ? $scope.triggerModel.visits : 1;
              if ($scope.triggerModel.visits == 1 && Number($scope.customizeCustomAlertsList[$scope.alertSelectedIndex].isSalt) == 2 && $scope.customizeCustomAlertsList[$scope.alertSelectedIndex].serviceLevel == '') {
                if ($scope.customizeCustomAlertsList[$scope.alertSelectedIndex].showRemoteMonitoringData) {
                    if ($scope.customizeCustomAlertsList[$scope.alertSelectedIndex].isRemoteMonitoringData) {
                        $scope.customizeCustomAlertsList[$scope.alertSelectedIndex].triggerStatus = "all";
                    } else {
                        $scope.customizeCustomAlertsList[$scope.alertSelectedIndex].triggerStatus = "custom";
                    }
                }
               } else {
                $scope.customizeCustomAlertsList[$scope.alertSelectedIndex].triggerStatus = "custom";
                }
              }
              apiGateWay.send("/company/customize_alerts?get=1", {"postData": $scope.customizeCustomAlertsList, "type": "CUSTOM"}).then(function(response){
                  if(response.data.status == 200){
                        var responseData = response.data;
                        $scope.getCustomizeAlerts();
                        var customizeCustomAlertsList = angular.copy($scope.customizeCustomAlertsList);
                        if(Object.keys(responseData.data).length > 0){
                          angular.forEach(customizeCustomAlertsList, function(element, index){
                              if(element && element.id == 0 && element.randomId && responseData.data[element.randomId]){
                                  $scope.customizeCustomAlertsList[index].id = responseData.data[element.randomId]
                              }
                          })
                        }

                  }else{
                    $scope.customAlertErrorMessage = response.data.message;
                  }
                  $scope.isProcessingCustom = false;
              }, function(error){
                  $scope.customizeAlertError = error;
                  $scope.isProcessingCustom = false;
              })
        }


        $scope.deleteRow = function(customAlertObj, index){
            $scope.clearCustomAlertInterval();
            $scope.clearInterval();
            if(customAlertObj && customAlertObj.id==0){
              $scope.customizeCustomAlertsList.splice(index, 1);
              return
            }
            $scope.customAlertObj = customAlertObj;
            $scope.index = index;
            ngDialog.open({
                template: 'deletCustomAlertConfirm.html',
                className: 'ngdialog-theme-default',
                closeByNavigation: true,
                scope: $scope,
                preCloseCallback: function () {
                  $scope.customAlertObj = '';
                  $scope.index = '';
                }
            });
        }

        $scope.closeModal = function(){
            ngDialog.closeAll()
        }
        $scope.confirmCustomAlertAction = function(customAlertObj, index){
            $scope.isProcessingCustom = true;
            $scope.customAlertErrorMessage = false;
            $scope.closeModal()
            apiGateWay.send("/company/customize_alert_delete", {"id": customAlertObj.id}).then(function(response){
                if(response.data.status == 200){
                      var responseData = response.data.data;
                      $scope.customizeCustomAlertsList.splice(index, 1);
                }else{
                    $scope.customAlertErrorMessage = response.data.message;
                }

                $scope.isProcessingCustom = false;
            }, function(error){
                $scope.customizeAlertError = error;
                $scope.isProcessingCustom = false;
            })
        }


        $scope.cleanAlertNameString = function(index, name){
            alertKey = name.replace(' ', '');
            alertKey = alertKey.replace('-', '');
            alertKey = alertKey.replace('/', '');
            alertKey = alertKey.replace('~', '');
            alertKey = alertKey.replace('!', '');
            alertKey = alertKey.replace('@', '');
            alertKey = alertKey.replace('#', '');
            alertKey = alertKey.replace('$', '');
            alertKey = alertKey.replace('%', '');
            alertKey = alertKey.replace('^', '');
            alertKey = alertKey.replace('&', '');
            alertKey = alertKey.replace('*', '');
            alertKey = alertKey.replace('(', '');
            alertKey = alertKey.replace(')', '');
            alertKey = alertKey.replace('=', '');
            alertKey = alertKey.replace(' ', '');
            alertKey = alertKey.toUpperCase();
            $scope.customizeCustomAlertsList[index].alertKey = alertKey;
        }

        $scope.toggleIssueAlertsRequired = function(index){
            $scope.issueReportAlertsList[index].required = $scope.issueReportAlertsList[index].required == 1 ? 0 : 1;
            $scope.submitIssueAlertForm();
        }

        $scope.toggleIssueAlertsPhoto= function(index){
            $scope.issueReportAlertsList[index].photo = $scope.issueReportAlertsList[index].photo == 1 ? 0 : 1;
            $scope.submitIssueAlertForm();
        }
        
        $scope.dismissAllAlertConfirm = function(){
            ngDialog.open({
                template: 'dismissAllAlertConfirm.html',
                className: 'ngdialog-theme-default',
                scope: $scope
            });
          }
        
          $scope.confirmDismissAllAlertAction = function(){
            $scope.isProcessingSystem = true;
            ngDialog.closeAll()
            apiGateWay.send("/dismiss_alerts", {"name":$scope.permissions.firstName + ' ' + $scope.permissions.lastName}).then(function(response) {
                if (response.data.status == 200) {
                    $scope.successUpdateAlert = response.data.message;
                }
                setTimeout(function(){
                  $scope.isProcessingSystem = false;
                  $scope.successUpdateAlert = false;
                  if (!$scope.$$phase) $scope.$apply()
                }, 2000);
                $scope.isProcessingSystem = false;
            }, function(error){
              $scope.isProcessingSystem = false;
            })
          }
          
    $scope.checkVisitInput = function(visits) {
        if (visits != null && visits != 0) {
            $scope.triggerModel.visits = Number(visits);
            $scope.triggerModel.frequencyType = 2;
       } else {
           $scope.triggerModel.visits = null;
       }
    }
    
    $scope.setFrequency = function(frequency){
        frequency = Number(frequency);
        if(frequency == 1){
            $scope.triggerModel.visits = 1;
            $scope.triggerModel.frequencyType = 1;
        } else {
            $scope.triggerModel.visits = 2;
            $scope.triggerModel.frequencyType = 2;
        }
    }
    
    $scope.frequencyKeyUp = (input) => {
        input = Number(input);
        if (input !== null && input > 1) {
            $scope.triggerModel.visits = input;
            $scope.triggerModel.frequencyType = 2;
        } else {
            $scope.triggerModel.visits = 1;
            $scope.triggerModel.frequencyType = 1;
        }
    }
});
