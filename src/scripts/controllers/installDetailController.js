angular.module('POOLAGENCY').controller('installDetailController', function($scope, auth, deviceDetector, $timeout, $rootScope, $filter, $sce, apiGateWay, service, $stateParams, ngDialog) {
    $scope.addressId = $stateParams.addressId;
    $scope.selectDate = '';
    $scope.currentPage = 1;
    $scope.limit = 5;
    $scope.dir = 'asc';
    $scope.column = 'technicianName';
    $scope.isProcessing = false;
    $scope.chlorineData = [];
    $scope.phData = [];
    $scope.jobData = [];
    $scope.dueData = [];
    $scope.gaugeDescription='';
    $scope.filterPsiData = [];
    $scope.alertCountData = [];
    $scope.addressJobDetails = [];
    $scope.instHistory = {};
    $scope.jobSensor = {};
    $scope.jobId = 0;
    $scope.sensorModel = [];
    $scope.showField = [];
    $scope.managerProfileImage = '/static/uploads/members/issue-picture-1488986702.JPEG';
    $scope.slides = [];

    $scope.loggedInRole = auth.loggedInRole();


    $scope.showSensor = function() {
        ngDialog.open({
            template: 'sensor.html',
            className: 'ngdialog-theme-default',
            scope: $scope,
            preCloseCallback: function() {}
        });
    };
    //to get customer job list
    $scope.getCustomerJobList = function() {
        $scope.isProcessing = true;
        var jobParam = {
            page: $scope.currentPage - 1,
            length: $scope.limit,
            dir: $scope.dir,
            column: $scope.column,
            addressId: $scope.addressId
        };
        if ($scope.fromDate != '' && $scope.toDate != '') {
            jobParam.startDate = $filter('date')(new Date($scope.fromDate), 'yyyy-MM-dd');
            jobParam.endDate = $filter('date')(new Date($scope.toDate), 'yyyy-MM-dd');
        }
        apiGateWay.get("/job", jobParam).then(function(response) {
            if (response.data.status == 200) {
                var jobListResponse = response.data.data;
                $scope.totalRecord = jobListResponse.rows;
                $scope.totalPage = ($scope.totalRecord % $scope.limit) !== 0 ? parseInt($scope.totalRecord / $scope.limit) : parseInt(($scope.totalRecord / $scope.limit)) - 1;
                $scope.jobList = jobListResponse.data;
            } else {
                $scope.jobList = [];
                var analyticsData = {};
                analyticsData.requestData = jobParam;
                analyticsData.userData = $rootScope.userSession;
                analyticsData.actionTime = new Date();
                analyticsData.errorData = response.data;
                var analyticsDataString = JSON.stringify(analyticsData);
                var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
                $rootScope.storeAnalytics('Error - Get Customer Job List', "Error on getCustomerJobList - " + currentDateTime, analyticsDataString, 0, true);
            }
            $scope.isProcessing = false;
        });
    };
    //to get job images by jobid
    $scope.jobImages = function() {
        if ($scope.jobId) {
            $scope.isProcessing = true;
            apiGateWay.get("/job_images", {
                jobId: $scope.jobId
            }).then(function(response) {
                if (response.data) {
                    if (response.data.status == 200) {
                        $scope.slides = response.data.data;
                    }
                }
                $scope.isProcessing = false;
            });
        }
    }
    $scope.goToCustomerJobListPage = function(page) {
        $scope.currentPage = page;
        $scope.getCustomerJobList();
    };
    $scope.installer = {};
    //to get customer info
    $scope.getCustomerInfo = function() {
        $scope.isProcessing = true;
        var pdata = {
            addressId: $scope.addressId,
            filterMonth: $scope.filterMonth
        };
        apiGateWay.get("/installer_details", pdata).then(function(response) {
            if (response.data) {
                if (response.data.status == 200) {
                    $scope.customerinfo = response.data.data;
                    $scope.customerDetail = response.data.customer;
                    if ($scope.customerinfo.customer.managerProfileImage != '' && $scope.customerinfo.customer.managerProfileImage != null) {
                        $scope.managerProfileImage = $scope.customerinfo.customer.managerProfileImage;
                    }
                    $scope.serviceManagerName = $scope.customerinfo.customer.serviceManagerName;
                    $scope.jobList = $scope.customerinfo.data;
                    $scope.job = $scope.jobList[0];
                    $scope.jobId = $scope.jobList[0].jobId;
                    $scope.activityModel = {
                        "jobId": $scope.jobId,
                        "gallanogeCalculated": null,
                        "saltSystem": ""
                    }
                    $scope.addressJobDetails = $scope.customerinfo.addressJobDetails;
                    $rootScope.title = 'Installation - ' + $scope.customerinfo.customer.firstName + ' ' + $scope.customerinfo.customer.lastName;
                    $scope.addressJobDetails = response.data.data.addressJobDetails;
                    $scope.installer = response.data.data.installer;
                    $scope.installer.userImage = ($scope.installer.userImage == '') ? 'resources/images/customer-icon.jpg' : $scope.installer.userImage;
                    var g = 0;
                    angular.forEach($scope.jobList[0].alerts, function(value, key) {
                        if ((value.issue).length > 0 && g == 0) {
                            var issueObj = value.issue[0];
                            var openedIssueType = 'client';
                            $scope.checkConfirmOverRide(issueObj, openedIssueType);
                            $scope.alertsIssueTabs($scope.jobList[0], issueObj, openedIssueType);
                            g = 1;
                        }
                    });
                    if (g == 0) {
                        angular.forEach($scope.jobList[0].alerts, function(value, key) {
                            if ((value.systemIssue).length > 0 && g == 0) {
                                var issueObj = value.systemIssue[0];
                                var openedIssueType = 'system';
                                $scope.alertsIssueTabs($scope.jobList[0], issueObj, openedIssueType);
                                g = 1;
                            }
                        });
                    }
                    $scope.getInstallHistory($scope.installer.installerId, $scope.jobList[0].jobId);
                    $scope.jobImages();
                } else {
                    $scope.customerinfo = [];
                    var analyticsData = {};
                    analyticsData.requestData = pdata;
                    analyticsData.userData = $rootScope.userSession;
                    analyticsData.actionTime = new Date();
                    analyticsData.errorData = response.data;
                    var analyticsDataString = JSON.stringify(analyticsData);
                    var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
                    $rootScope.storeAnalytics('Error - Get Customer Info', "Error on getCustomerInfo - " + currentDateTime, analyticsDataString, 0, true);
                }
            }
            $scope.isProcessing = false;
        }, function(error) {
        });
    };
    $scope.showNote = function(note) {
        $scope.note = note;
        ngDialog.open({
            template: 'note.html',
            className: 'ngdialog-theme-default',
            scope: $scope,
            preCloseCallback: function() {}
        });
    };
     $scope.editSensor=function(sensorForm,index)
    {

         $scope.showField[index].edit = false;
        $scope.showField[index].update = true;
        $scope.showField[index].delete = false;
        $scope.showField[index].cancel = true;
    }

     $scope.cancelSensor=function(index)
    {
        $scope.sensorModel[index].name = $scope.jobSensor[index].name;

         $scope.showField[index].edit = true;
        $scope.showField[index].update = false;
        $scope.showField[index].delete = true;
        $scope.showField[index].cancel = false;
        if (!$scope.$$phase) $scope.$apply();
    }
    $scope.updateSensor = function(sensorForm, index) {
        if (sensorForm.$valid) {
            apiGateWay.send("/update_sensor", $scope.sensorModel[index]).then(function(response) {
                if (response.data.status == 201) {

                    $scope.jobSensor[index] = $scope.sensorModel[index];
                    $scope.showField[index].edit = true;
                        $scope.showField[index].update = false;
                        $scope.showField[index].delete = true;
                        $scope.showField[index].cancel = false;
                } else {
                    $scope.successMsg = '';
                    $scope.error = response.data.message;
                    var analyticsData = {};
                    analyticsData.requestData = $scope.sensorModel[index];
                    analyticsData.userData = $rootScope.userSession;
                    analyticsData.actionTime = new Date();
                    analyticsData.errorData = response.data;
                    var analyticsDataString = JSON.stringify(analyticsData);
                    var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
                    $rootScope.storeAnalytics('Error - Update Installer Sensor', "Error on updateSensor - " + currentDateTime, analyticsDataString, 0, true);
                }
                $scope.isProcessing = false;
            }, function(error) {
                var msg = 'Error';
                if (typeof error == 'object' && error.data && error.data.message) {
                    msg = error.data.message;
                } else {
                    msg = error;
                }
                var analyticsData = {};
                analyticsData.requestData = $scope.sensorModel[index];
                analyticsData.userData = $rootScope.userSession;
                analyticsData.actionTime = new Date();
                analyticsData.errorData = error;
                var analyticsDataString = JSON.stringify(analyticsData);
                var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
                $rootScope.storeAnalytics('Error - Update Installer Sensor', "Error on updateSensor - " + currentDateTime, analyticsDataString, 0, true);
                $scope.successMsg = '';
                $scope.error = msg;
                setTimeout(function() {
                    $scope.error = '';
                    $scope.isProcessing = false;
                }, 2000);
            });
        }
    }
    $scope.deleteSensor = function(sensorForm, index) {
            if(confirm("Are you sure you want to delete this?")) {
                if (sensorForm.$valid) {
                    apiGateWay.send("/delete_sensor", $scope.sensorModel[index]).then(function(response) {
                        if (response.data.status == 201) {
                            $scope.jobSensor.splice(index, 1);
                            if($scope.jobSensor.length == 0)
                            {
                                ngDialog.close();
                            }
                        } else {
                            $scope.successMsg = '';
                            $scope.error = response.data.message;
                            var analyticsData = {};
                            analyticsData.requestData = $scope.sensorModel[index];
                            analyticsData.userData = $rootScope.userSession;
                            analyticsData.actionTime = new Date();
                            analyticsData.errorData = response.data;
                            var analyticsDataString = JSON.stringify(analyticsData);
                            var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
                            $rootScope.storeAnalytics('Error - Delete Installer Sensor', "Error on deleteSensor - " + currentDateTime, analyticsDataString, 0, true);
                        }
                        $scope.isProcessing = false;
                    }, function(error) {
                        var msg = 'Error';
                        if (typeof error == 'object' && error.data && error.data.message) {
                            msg = error.data.message;
                        } else {
                            msg = error;
                        }
                        var analyticsData = {};
                        analyticsData.requestData = $scope.sensorModel[index];
                        analyticsData.userData = $rootScope.userSession;
                        analyticsData.actionTime = new Date();
                        analyticsData.errorData = error;
                        var analyticsDataString = JSON.stringify(analyticsData);
                        var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
                        $rootScope.storeAnalytics('Error - Delete Installer Sensor', "Error on deleteSensor - " + currentDateTime, analyticsDataString, 0, true);
                        $scope.successMsg = '';
                        $scope.error = msg;
                        setTimeout(function() {
                            $scope.error = '';
                            $scope.isProcessing = false;
                        }, 2000);
                    });
                }
            }
        }
        //to show job pictures on dialog
    $scope.showPicturesVideos = function() {
        ngDialog.open({
            template: 'picturesVideos.html',
            className: 'ngdialog-theme-default',
            scope: $scope,
            preCloseCallback: function() {}
        });
    };
    $scope.activityPictures = {};
    //to show activity pictures on dialog
    $scope.showActivityPictures = function(images) {
        $scope.activityPictures = images;
        ngDialog.open({
            template: 'activityPictures.html',
            className: 'ngdialog-theme-default',
            scope: $scope,
            preCloseCallback: function() {}
        });
    };
    $scope.saltSystemData = {
        "active": "Active Salt System",
        "present": "Present but Non-Functional",
        "no": "No Salt System"
    };
    //to save install detail
    $scope.saveInstall = function() {
        if ($scope.saveInstallForm.$valid) {
            $scope.isProcessing = true;
            var params = angular.copy($scope.activityModel);
            params['saltSystem'] = params['saltSystem'] ? 'active' : 'no';
            var activityModel = $scope.activityModel;
            apiGateWay.send("/installer_details", {
                "postData": params
            }).then(function(response) {
                if (response.data.status == 201) {

                    /*$scope.successMsg = response.data.message;
                    $scope.getInstallHistory($scope.installer.installerId,$scope.activityModel.jobId);

                    if($scope.gallanogeIndex != -1){
                        $scope.instHistory[$scope.gallanogeIndex].value = $scope.activityModel.gallanogeCalculated
                    }

                    if($scope.saltIndex != -1){
                        $scope.instHistory[$scope.saltIndex].value = $scope.activityModel.saltSystem
                    }
                    if (!$scope.$$phase) $scope.$apply();
                    */
                    $scope.getInstallHistory($scope.installer.installerId, $scope.activityModel.jobId);
                    $scope.error = '';
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

    //when edit button gets clicked
    $scope.editInstall = function() {
      if(!$scope.editInstallCond){
          $scope.editInstallCond = true || false;
          $scope.activityModel = {
              "jobId": $scope.jobId,
              "galId": 0,
              "saltId": 0,
              "gallanogeCalculated": null,
              "saltSystem": ""
          }
          $scope.gallanogeIndex = -1;
          $scope.saltIndex = -1;
          angular.forEach($scope.instHistory, function(activityHistory, key) {
              if (activityHistory.name == 'Gallonage') {
                  $scope.activityModel.gallanogeCalculated = activityHistory.value ? activityHistory.value : null;
                  $scope.activityModel.galId = activityHistory.installerTrackingId;
                  $scope.gallanogeIndex = key;
              }
              if (activityHistory.name == 'Salt System') {
                  $scope.activityModel.saltSystem = activityHistory.value;
                  $scope.activityModel.saltId = activityHistory.installerTrackingId;
                  $scope.saltIndex = key;
              }
          });

        }else{
          $scope.editInstallCond = false;
        }
      }



        //to get installer activity history by JobId/addressId
    $scope.getInstallHistory = function(installerId, jobId) {
        $scope.isProcessing = true;
        var pdata = {
            addressId: $scope.addressId,
            installerId: installerId,
            jobId: jobId,
            currentTime: Math.floor(Date.now() / 1000)
        };
        apiGateWay.get("/installer_history", pdata).then(function(response) {
            if (response.data) {
                if (response.data.status == 200) {
                    responseData = response.data.data;
                    if (responseData.totalMinutes && responseData.totalMinutes.includes('mins')) {
                        responseData.totalMinutes = $rootScope.calculateMins(responseData.totalMinutes)
                    }
                    $scope.installerHistory = responseData;
                    $scope.instHistory = responseData.instHistory;
                    $scope.installDetail = responseData.installDetail;
                    $scope.installDetail.gallonage = responseData.installDetail.gallonage ? responseData.installDetail.gallonage : null;

                    if (!$scope.$$phase) $scope.$apply();
                    $scope.jobSensor = responseData.jobSensorData;
                    angular.forEach($scope.jobSensor, function(value, key) {
                        $scope.sensorModel[key]={};
                        angular.copy(value,$scope.sensorModel[key]);
                        // $scope.sensorModel[key] = value;
                        $scope.showField[key] = {};
                        $scope.showField[key].edit = true;
                        $scope.showField[key].update = false;
                        $scope.showField[key].delete = true;
                        $scope.showField[key].cancel = false;
                    });
                    $scope.installNotes = responseData.installNotes;
                    $scope.activityModel.galId = $scope.installDetail.installerTrackingId;
                    $scope.activityModel = {
                        "jobId": jobId,
                        "gallanogeCalculated": $scope.installDetail.gallonage ? parseFloat($scope.installDetail.gallonage) : null,
                        "galId": $scope.installDetail.installerTrackingId,
                        "saltSystem": $scope.installDetail.saltSystem == 'active' ? true : false,
                        "saltId":  $scope.installDetail.saltId ? $scope.installDetail.saltId : 0                       
                    }
                    $scope.totalMinutes = responseData.totalMinutes
                    $scope.startDate = responseData.startDate
                    $scope.editInstallCond = false;
                    if (!$scope.$$phase) $scope.$apply();
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
        });
    }
    $scope.getNumberToArray = function(num) {
        return new Array(num);
    };
    $scope.confirmOpen = false;
    $scope.overRide = false;
    //on toggle confirm button
    $scope.toggleConfirm = function() {
        $scope.overRide = false;
        if (!$scope.confirmOpen) {
            $scope.confirmOpen = true;
        } else {
            $scope.confirmOpen = false;
        }
    };
    //on toggle override button
    $scope.toggleOverRide = function() {
        $scope.confirmOpen = false;
        if (!$scope.overRide) {
            $scope.overRide = true;
        } else {
            $scope.overRide = false;
        }
    };
    $scope.$watch('jobDetails.alertsIssueArray[openedIssueType][selectedAlertIssueId].overrideNote', function(o, n) {
        if (o != undefined) {
            angular.element(document.getElementById("btn" + $scope.selectedAlertIssueId)).prop("disabled", false).removeClass('disabledBtn');
        } else {
            angular.element(document.getElementById("btn" + $scope.selectedAlertIssueId)).prop("disabled", true).addClass('disabledBtn');
        }
    });
    //to set alert title
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
        } else if (alertType == 'BrokenGauge') {
            selectedTabName = 'Broken PSI Gauge';
        } else if (alertType == 'MissingGauge') {
            selectedTabName = 'Missing PSI Gauge';
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
        } else if (alertType == 'BrokenGauge') {
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
    $scope.alertsIssueTabs = function(jobObj, issueObj, openedIssueType) {
        $scope.confirmOpen = false;
        $scope.overRide = false;
        $scope.openedIssueType = openedIssueType;
        $scope.issueObj = issueObj;
        if ($scope.issueObj != undefined) {
            $scope.selectedAlertIssueId = (openedIssueType == 'client') ? issueObj.alertIssueId : issueObj.systemIssueId;
        } else {
            $scope.selectedAlertIssueId = 0;
        }
        if (!$scope.openedJobId || $scope.openedJobId != jobObj.jobId) {
            $scope.openJobDetails(jobObj, 'iconClick');
        }
    };
    $scope.openJobDetails = function(jobObj, actionFrom) {
        $scope.actionFrom = actionFrom || 'direct';
        var jobId = jobObj.jobId;
        var c = 0;
        angular.forEach(jobObj.alerts, function(value) {
            if (value.issue.length > 0) {
                c = 1;
            }
        });
        if (c == 0) {
            $scope.issueObj = false;
        }
        if ($scope.openedJobId == jobId) {
            $scope.openedIssueType = '';
            $scope.selectedAlertIssueId = '';
            $scope.openedJobId = '';
            $scope.issueObj = '';
            return false;
        }
        $scope.openedJobId = jobId;
        jobDetails = jobObj;
        service.jobDetails[jobId] = jobDetails;
        $scope.parseJobDetails(jobDetails, actionFrom);
        // $scope.getJobDetails(jobId);
    };
    $scope.gotoCustomerDetails = function(jobId, addressId) {
        if ($scope.openedJobId && jobId && jobId == $scope.openedJobId) {
            $state.go('app.customerdetail', {
                addressId: addressId
            }, {
                reload: true
            });
        }
    };
    $scope.gotoTechnicianDetails = function(jobId, technicianId) {
        if ($scope.openedJobId && jobId && jobId == $scope.openedJobId) {
            $state.go('app.techniciandetail', {
                technicianId: technicianId
            }, {
                reload: true
            });
        }
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
    //to parse job detail data
    $scope.parseJobDetails = function (jobDetails) {
        var alertsIssueArray = [];
        var alertsAssetsArray = {};
        alertsIssueArray['client'] = [];
        alertsIssueArray['system'] = [];
        angular.forEach(jobDetails.alerts, function (parentElement) {
            if (parentElement.issue.length > 0) {
                angular.forEach(parentElement.issue, function (element) {
                    try {
                        if (element.confirmDetail) {
                            element.confirmDetail = (typeof element.confirmDetail == 'string') ? JSON.parse(element.confirmDetail) : element.confirmDetail;

                        } else {
                            element.confirmDetail = {
                                scheduleVisit: '',
                                contactCustomer: '',
                                discipliniaryAction: '',
                                contactPoolTech: ''
                            };
                        }

                    } catch (error) {
                        element.confirmDetail = {
                            scheduleVisit: '',
                            contactCustomer: '',
                            discipliniaryAction: '',
                            contactPoolTech: ''
                        };
                    }
                    if (typeof alertsIssueArray[element.alertIssueId] == 'undefined') {
                        alertsIssueArray[element.alertIssueId] = [];
                    }
                    alertsAssetsArray[element.alertIssueId] = parentElement.assets;
                    alertsIssueArray['client'][element.alertIssueId] = element;
                });
            }
            if (parentElement.systemIssue.length > 0) {
                angular.forEach(parentElement.systemIssue, function (element) {
                    try {
                        if (element.confirmDetail) {
                            element.confirmDetail = (typeof element.confirmDetail == 'string') ? JSON.parse(element.confirmDetail) : element.confirmDetail;
                        } else {
                            element.confirmDetail = {
                                scheduleVisit: '',
                                contactCustomer: '',
                                discipliniaryAction: '',
                                contactPoolTech: ''
                            };
                        }
                    } catch (error) {
                        element.confirmDetail = {
                            scheduleVisit: '',
                            contactCustomer: '',
                            discipliniaryAction: '',
                            contactPoolTech: ''
                        };
                    }
                    if (typeof alertsIssueArray[element.systemIssueId] == 'undefined') {
                        alertsIssueArray[element.systemIssueId] = [];
                    }
                    alertsIssueArray['system'][element.systemIssueId] = element;
                });
            }
        });
        jobDetails.alertsIssueArray = alertsIssueArray;

        jobDetails.alertsAssetsArray = alertsAssetsArray;
        $scope.jobDetails = jobDetails;
        $scope.activityHistory = (jobDetails.activityHistory) ? jobDetails.activityHistory : jobDetails.instHistory;
        setTimeout(function () {
            try {
                if ($scope.actionFrom != 'iconClick') {
                    document.querySelector("#issues-tabs-" + jobDetails.jobId + " > div > a:first-of-type").click();
                }
            } catch (error) { }
        }, 100);
    };
    $scope.alertPictures = {};
    //to show alert pictures on dialog
    $scope.showAlertPictures = function(images) {
        $scope.alertPictures = images;
        ngDialog.open({
            template: 'alertPictures.html',
            className: 'ngdialog-theme-default',
            scope: $scope,
            preCloseCallback: function() {}
        });
    };
    $scope.alertConfirmModel = {
        contactPoolTech: '',
        contactCustomer: '',
        scheduleVisit: '',
        discipliniaryAction: ''
    };
    $scope.startDate = '';
    //to get job detail data by jobId
    $scope.getJobDetails = function(jobId, actionFrom) {
        if (!jobId) {
            return
        }
        if ($rootScope.userSession) {
            var userId = $rootScope.userSession.id;
            $scope.isProcessing = true;
            apiGateWay.get("/job_details", {
                jobId: jobId,
                userId: userId,
                type: "installer"
            }).then(function(response) {
                if (response.data.status == 200) {
                    var jobDetails = response.data.data;
                    service.jobDetails[jobId] = jobDetails;
                    $scope.jobSensor = jobDetails.jobSensorData;
                    $scope.activityModel = {
                        "jobId": jobDetails.jobId,
                        "gallanogeCalculated": null,
                        "saltSystem": ""
                    }
                    if (jobDetails.managerProfileImage != '') {
                        $scope.managerProfileImage = jobDetails.managerProfileImage;
                    }
                    $scope.serviceManagerName = jobDetails.serviceManagerName;
                    // $scope.instHistory = jobDetails.instHistory;
                    $scope.parseJobDetails(jobDetails, actionFrom);
                }
                $scope.isProcessing = false;
            });
        }
    };


    $scope.overridenModel = [];
    //to submit override data
    $scope.submitOveride = function (overRideNote) {
        if (overRideNote) {
            $scope.isProcessing = true;
            apiGateWay.send("/update_alert", {
                issueId: $scope.selectedAlertIssueId,
                overideNote: overRideNote,
                issueType: $scope.openedIssueType,
                title: $scope.issueObj.title ? $scope.issueObj.title : $scope.issueObj.description,
                isConfirm: 0
            }).then(function (response) {
                $scope.showDot[$scope.openedIssueType][$scope.selectedAlertIssueId] = false;
                $scope.successOveride = 'Alert has been overridden successfully';
                angular.element(document.getElementById("btn" + $scope.selectedAlertIssueId)).prop("disabled", true).addClass('disabledBtn');
                if (response.data.data.isJobComplete) {
                    if (response.data.data.isJobComplete == 1) {
                        if (response.data.data.jobDetail) {
                            $scope.closeJob(response.data.data.jobDetail);
                        }
                    }
                }
                $scope.isProcessing = false;
                $scope.hideAlertIssueIds[$scope.openedIssueType][$scope.selectedAlertIssueId] = "";
                $scope.hideAlertIssueIds[$scope.openedIssueType][$scope.selectedAlertIssueId] = true;
                /*
                var alertTitle = $scope.issueObj.title != undefined ? $scope.issueObj.title : $scope.setTitle($scope.issueObj.type);
                var actionName = "";
                actionName += "Page - Alerts\n";
                actionName += "Action - " + alertTitle + " alert overridden \n";
                $rootScope.addAuditLog($scope.jobDetails.jobId, actionName);
                */
                $scope.alertTimeout = setTimeout(function () {
                    $scope.successOveride = '';
                    $scope.openedIssueType = '';
                    $scope.selectedAlertIssueId = '';
                    $scope.issueObj = "";
                    if (!$scope.$$phase) $scope.$apply();
                    $scope.alertTimeout = false;
                }, 2000);
                var analyticsData = {};
                analyticsData.userData = $rootScope.userSession;
                analyticsData.data = {
                    "jobId": $scope.openedJobId,
                    "overRideNote": overRideNote,
                    "issueId": $scope.selectedAlertIssueId
                };
                analyticsData.actionTime = new Date();
                var analyticsDataString = JSON.stringify(analyticsData);
                var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
                $rootScope.storeAnalytics('Alerts - Override', "Alerts - Submit Override - " + $scope.openedJobId + " - " + currentDateTime, analyticsDataString, 0, true);

            }, function (error) {
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
                setTimeout(function () {
                    $scope.errorOveride = '';
                }, 2000);
                $scope.isProcessing = false;
            });
        }
    };
    //to submit confirm data
    $scope.callConfirmSubmit = function () {
        if ($scope.selectedAlertIssueId && $scope.jobDetails.alertsIssueArray[$scope.openedIssueType][$scope.selectedAlertIssueId].confirmDetail) {
            $scope.isProcessing = true;
            apiGateWay.send("/update_alert", {
                issueId: $scope.selectedAlertIssueId,
                isConfirm: 1,
                issueType: $scope.openedIssueType,
                confirmDetails: $scope.jobDetails.alertsIssueArray[$scope.openedIssueType][$scope.selectedAlertIssueId].confirmDetail
            }).then(function (response) {
                var analyticsData = {};
                analyticsData.userData = $rootScope.userSession;
                analyticsData.data = {
                    jobId: $scope.openedJobId,
                    confirmDetails: $scope.jobDetails.alertsIssueArray[$scope.openedIssueType][$scope.selectedAlertIssueId].confirmDetail,
                    issueId: $scope.selectedAlertIssueId
                };
                $scope.isProcessing = false;
                service.jobDetails[$scope.jobDetails.jobId] = $scope.jobDetails;
                $scope.showDot[$scope.openedIssueType][$scope.selectedAlertIssueId] = !checkConfirmDetail(JSON.stringify($scope.jobDetails.alertsIssueArray[$scope.openedIssueType][$scope.selectedAlertIssueId].confirmDetail));
                var Cond = 0;
                angular.forEach($scope.jobDetails.alertsIssueArray[$scope.openedIssueType][$scope.selectedAlertIssueId].confirmDetail, function (value, key) {
                    if (value === true) {
                        Cond++;
                    }
                    if (value === false) {
                        Cond++;
                    }
                });
                if (Cond == 4) {
                    /*
                    var alertTitle = $scope.issueObj.title != undefined ? $scope.issueObj.title : $scope.setTitle($scope.issueObj.type);
                    var actionName = "";
                    actionName += "Page - Alerts\n";
                    actionName += "Action - " + alertTitle + " alert confirmed\n";
                    $rootScope.addAuditLog($scope.jobDetails.jobId, actionName);
                    */
                    $scope.hideAlertIssueIds[$scope.openedIssueType][$scope.selectedAlertIssueId] = "";
                    $scope.hideAlertIssueIds[$scope.openedIssueType][$scope.selectedAlertIssueId] = true;
                    $scope.openedIssueType = '';
                    $scope.selectedAlertIssueId = '';
                    $scope.issueObj = '';
                    $scope.isProcessing = false;
                    if (response.data.data.isJobComplete) {
                        if (response.data.data.isJobComplete == 1) {
                            if (response.data.data.jobDetail) {
                                $scope.closeJob(response.data.data.jobDetail);
                            }
                        }
                    }
                } else {
                    $scope.isProcessing = false;
                }
                analyticsData.actionTime = new Date();
                var analyticsDataString = JSON.stringify(analyticsData);
                var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
                $rootScope.storeAnalytics('Alerts - Confirm', "Alerts - Submit Confirm JobId - " + $scope.openedJobId + " - " + currentDateTime, analyticsDataString, 0, true);
            }, function (error) {
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
});
