angular.module('POOLAGENCY').controller('dashboardController', function ($scope, $window, $rootScope, $filter, $sce, $state, $stateParams, apiGateWay, service, auth, Analytics, ngDialog, configConstant, pendingRequests, $q, $timeout) {    
    $scope.currentPage = 1;
    $scope.showingFrom = 1;
    $scope.limit = 10;
    $scope.dir = 'asc';
    $scope.column = 'createTimeStamp';
    $scope.isProcessing = false;
    $scope.confirmOpen = false;
    $scope.overRide = false;
    $scope.jobDetailId = 0;
    $scope.slides = [];
    $scope.gaugeDescription='';
    $scope.totalAlerts = 0;
    service.jobDetails = [];
    $scope.showLoader = [];
    $scope.prevJobObj = false;
    $scope.openJobObj = 0;
    $scope.totalRecord = 0;
    $scope.activityTitle = null;
    $scope.managerArray = [];
    $scope.techNotesArr = {};
    $scope.alertFilters = {"TECHNICIANS" : [], "ISSUE_REPORTS" : [], "ALERTS" : [], "CUSTOMER_TAG" : [], "WATERDEVICE": []};
    $scope.routesFilterList = [];
    $scope.showFilterBox = false;
    $scope.alertData = [];
    $scope.dismissMsg = {msg: ''};
    $scope.showDismissMsg = false;
    $scope.currentUser = auth.getSession();
    $scope.firstTimeLoad = true;
    $scope.alertIsLoading = true;
    $scope.alertCountData = {};
    $scope.alertParams =  {
        page: $scope.currentPage - 1,
        length: $scope.limit,
        dir: $scope.dir,
        column: $scope.column,
        t: new Date().getTime(),
        techniciansFilter : '',
        issueReportsFilter : '',
        alertsFilter : '',
        alertsOn : 0,
        issueReportsOn : 0,
        notCompletedOn : 0
    };
    $scope.alertCountLoaders = [true, true, true];
    $scope.alertFilterEnabled = [1, 2, 3];
    $scope.hideAlertIssueIds = {
        "client": [],
        "system": []
    };
    $scope.statusCount = [
        {
            title: 'Alerts',
            count: 0,
            status: true
        },
        {
            title: 'Issue Reports',
            count: 0,
            status: true
        },
        {
            title: 'Not Completed',
            count: 0,
            status: true
        },
    ];
    $scope.onExit = function () {
        if ($scope.openedJobId > 0) {
            $rootScope.addUpdateManager("remove", $scope.openedJobId);
        }       
        return;
    };
    $window.onbeforeunload = $scope.onExit;
 

    var companySelectedEventListener =  $rootScope.$on("companySelected", function (data) {
        // $scope.currentPage = 1;
        // $scope.showingFrom = 1;
        // $scope.getAlertFilterData();
        // $scope.getAlertList();
        // $scope.firstTimeLoad = true;
        // // $scope.resetFilter();
        $scope.alertIsLoading = true;
        $rootScope.openAlertDashboard();     
    });
    $scope.noneRouteFilterTemplate = {
        id: 0,
        templateName: "None",
        techFilter: [],
        typeFilter: [],
        statusFilter: [],
        tags: [],
        isDefault: 0,
        appliedToUnscheduled: 0
    }
    $scope.$on("$destroy", function () {
        companySelectedEventListener();
        // Make sure that the interval is destroyed too
        $rootScope.socket.off("manager_response", function (data) {
        });
        $rootScope.socket.removeListener("manager_response");
    });
    //to get job list with limit
    $scope.getAlertList = function (type) {
        type = type || '';
        if(typeof $rootScope.socket != 'undefined'){
            var companyId = auth.getSession().companyId
            //$rootScope.socket.emit("checkPendingJobCount", {companyId: companyId});
        }

        if (type == '') {
            $scope.alertIsLoading = true;
        }
        // filter selection check && add to API
        var params = angular.copy($scope.alertParams);
        $scope.currentPage = $scope.currentPage < 1 ? 1 : $scope.currentPage;
        params.page = $scope.currentPage - 1
        angular.forEach($scope.statusCount, function(filter){
            if (filter.title == 'Alerts' && filter.status == true) {
             delete params.alertsOn;
            } else if (filter.title == 'Alerts' && filter.status == false) {
             params.alertsOn = 1;
            }
             
            if (filter.title == 'Issue Reports' && filter.status == true) {
             delete params.issueReportsOn;
            } else if (filter.title == 'Issue Reports' && filter.status == false) {
             params.issueReportsOn = 1;
            }
            
            if (filter.title == 'Not Completed' && filter.status == true) {
             delete params.notCompletedOn;
            } else if (filter.title == 'Not Completed' && filter.status == false) {
             params.notCompletedOn = 1;
            }
            
         });
         
         if ($scope.alertFilters.TECHNICIANS.length > 0) {
             params.techniciansFilter = $scope.alertFilters.TECHNICIANS.toString();
         } else {
             delete params.techniciansFilter;
         }
         
         if ($scope.alertFilters.ISSUE_REPORTS.length > 0) {
             params.issueReportsFilter = $scope.alertFilters.ISSUE_REPORTS.toString();
         } else {
             delete params.issueReportsFilter;
         }
         
         if($scope.alertFilters.ALERTS.length > 0 ) {
             params.alertsFilter = $scope.alertFilters.ALERTS.toString();
         } else {
             delete params.alertsFilter;
         }
         if($scope.alertFilters.CUSTOMER_TAG && $scope.alertFilters.CUSTOMER_TAG.length > 0 ) {
            params.tagsFilter = $scope.alertFilters.CUSTOMER_TAG.toString();
        } else {
            delete params.tagsFilter;
        }

        if ($scope.alertFilters.WATERDEVICE.length > 0) {
            params.waterDeviceFilter = $scope.alertFilters.WATERDEVICE.toString();
        } else {
            delete params.waterDeviceFilter;
        }

        $scope.alertIsLoading = true;
        let endpoint = "/alert_list";
        var currEnvironment = configConstant.currEnvironment;
        var apiUrl = configConstant[currEnvironment].server;        
        var pr = pendingRequests.get();        
        if (pr.length > 0) {
            pr.forEach(function(r){
                if (r.url === apiUrl + endpoint) {                    
                    r.canceller.resolve()
                    return
                }
            })
        } 
        clearInterval($scope.alertsAPIInteval)
        $scope.alertsAPIInteval = setTimeout(function(){
        $scope.getAlertCount(params);
        apiGateWay.get(endpoint, params).then(
          function (response) {
            if (response.data) {
              if (response.data.status == 200) {
                $scope.hideAlertIssueIds = { client: [], system: [] };
                $scope.alertData = response.data.data;
                $scope.totalRecord = $scope.alertData.rows;

                $scope.totalPage =
                  $scope.totalRecord % $scope.limit !== 0
                    ? parseInt($scope.totalRecord / $scope.limit)
                    : parseInt($scope.totalRecord / $scope.limit) - 1;
                $scope.jobList = $scope.alertData.data.length > 0 ? $scope.alertData.data : $scope.alertIsLoading = false, [];
                $scope.showLoader = [];
                $scope.managerArray = [];
                $scope.jobListArray = [
                  { type: "Urgent", data: [] },
                  { type: "High", data: [] },
                  { type: "Normal", data: [] },
                  { type: "Low", data: [] },
                  { type: "", data: [] },
                ];

                angular.forEach($scope.jobList, function (value, index) {
                    value.alertFromDevice = false;
                    if (value.deviceId && value.deviceId != 0) {
                        value.alertFromDevice = true;
                    }
                  if (value.priorityLevel == "URGENT") {
                    $scope.jobListArray[0].data.push(value);
                  } else if (value.priorityLevel == "HIGH") {
                    $scope.jobListArray[1].data.push(value);
                  } else if (
                    value.priorityLevel == "NORMAL" ||
                    !value.priorityLevel
                  ) {
                    $scope.jobListArray[2].data.push(value);
                  }
                  if (value.priorityLevel == "LOW") {
                    $scope.jobListArray[3].data.push(value);
                  }

                  $scope.managerArray[value.jobId] = {
                    managerName: $rootScope.parseName(
                      value.serviceManagerName,
                      18
                    ),
                    managerFirstName: value.serviceManagerFirstName,
                    managerLastName: value.serviceManagerLastName,
                    managerImage: value.managerProfileImage,
                    managerId: value.serviceManagerId,
                  };
                  if (value.serviceManagerId == $rootScope.userSession.userId) {
                    $scope.openedJobId = $scope.openJobId =
                      value.serviceManagerId;
                  }
                });
                $scope.alertIsLoading = false;
              } else {
                $scope.jobList = [];
                $scope.alertData = [];
                var analyticsData = {};
                analyticsData.requestData = {
                  page: $scope.currentPage - 1,
                  length: $scope.limit,
                  dir: $scope.dir,
                  column: $scope.column,
                };
                analyticsData.userData = $rootScope.userSession;
                analyticsData.actionTime = new Date();
                analyticsData.errorData = response.data;
                var analyticsDataString = JSON.stringify(analyticsData);
                var currentDateTime = $filter("date")(new Date(),"MM/dd/yyyy hh:m:ss a");
                $rootScope.storeAnalytics("Error - GET JOB LIST", "Error on Get Job List - " + errorData + " - " + currentDateTime, analyticsDataString, 0, true);
                $scope.alertIsLoading = false;
              }
            } else {
              $scope.jobList = [];
              $scope.alertData = [];
              $scope.alertIsLoading = false;
            }
          },
          function (error) {
            var analyticsData = {};
            analyticsData.requestData = {
              page: $scope.currentPage - 1,
              length: $scope.limit,
              dir: $scope.dir,
              column: $scope.column,
            };
            analyticsData.userData = $rootScope.userSession;
            analyticsData.actionTime = new Date();
            analyticsData.errorData = error;
            var analyticsDataString = JSON.stringify(analyticsData);
            var currentDateTime = $filter("date")( new Date(), "MM/dd/yyyy hh:m:ss a");
            $rootScope.storeAnalytics("Error", "Error on Get Job List - " + error + " - " + currentDateTime, analyticsDataString, 0, true);
            $scope.alertIsLoading = false;
          }
        );
        }, 100)
    };
    $rootScope.getCrmStatus();
    $scope.checkAlertCompletion = function(issueObj, alertType){
        if(issueObj && issueObj.closeStatus == 1){
            var issueId = alertType == 'client' ? issueObj.alertIssueId : issueObj.systemIssueId;
            $scope.hideAlertIssueIds[alertType][issueId] = true;
        }
    }

    $scope.getNumberToArray = function (num) {
        return new Array(num);
    };
    $scope.goToJobPage = function (page) {
        $scope.currentPage = page;
        $scope.showingFrom = page* $scope.limit - ($scope.limit-1);
        $scope.getAlertList();
    };
    
    $scope.orderByJobList = function (column) {
        $scope.column = column;
        $scope.dir = ($scope.dir == 'desc') ? 'asc' : 'desc';
        $scope.getAlertList();
    };
    
    $scope.getAlertCount = function (params) {
        if (params.page > 0) {  return; }
        angular.forEach($scope.alertCountLoaders, function(_loader, index){
            $scope.alertCountLoaders[index] = true;
            if (index == 0 && params.hasOwnProperty('alertsOn')) {
                $scope.alertCountData.totalAlerts = 0;
                $scope.alertCountLoaders[0] = false;
                delete $scope.alertFilterEnabled[0];
            } else if (index == 1 && params.hasOwnProperty('issueReportsOn')) {
                $scope.alertCountData.totalIssues = 0;
                $scope.alertCountLoaders[1] = false;
                delete $scope.alertFilterEnabled[1];
            } else if (index == 2 && params.hasOwnProperty('notCompletedOn')) {
                $scope.alertCountData.totalNotCompleted = 0;
                $scope.alertCountLoaders[2] = false;
                delete $scope.alertFilterEnabled[2];
            } else {
                $scope.alertCountLoaders[index] = true;
            }
        });
        // Function to make an API call with incremented `opt` value
        function makeApiCall(params, optValue) {
            params.opt = optValue;
            let isFilterEnabled = (params.hasOwnProperty('alertsOn') || params.hasOwnProperty('issueReportsOn') || params.hasOwnProperty('notCompletedOn')) ? true : false;
            if (isFilterEnabled) {
                if (optValue == 1 && !params.hasOwnProperty('alertsOn')) {
                    return apiGateWay.get("/alerts_count", params);
                }
                
                if (optValue == 2 && !params.hasOwnProperty('issueReportsOn')) {
                    return apiGateWay.get("/alerts_count", params);
                }
                
                if (optValue == 3 && !params.hasOwnProperty('notCompletedOn')) {
                    return apiGateWay.get("/alerts_count", params);
                }
            } else {
                return apiGateWay.get("/alerts_count", params);
          }
        }
        $scope.alertCountData = {};
        angular.forEach($scope.alertFilterEnabled, function(item) {
            makeApiCall({ ...params }, item)
                .then((response) => {
                    if (response.data.status == 200) {
                        const data = response.data.data;
                        if (data.hasOwnProperty('totalAlerts')) {
                            $scope.alertCountData.totalAlerts = data.totalAlerts;
                            $scope.alertCountLoaders[0] = false;
                        }
                        if (data.hasOwnProperty('totalIssues')) {
                            $scope.alertCountData.totalIssues = data.totalIssues;
                            $scope.alertCountLoaders[1] = false;
                        }
                        if (data.hasOwnProperty('totalNotCompleted')) {
                            $scope.alertCountData.totalNotCompleted = data.totalNotCompleted;
                            $scope.alertCountLoaders[2] = false;
                        }
                    }
                })
                .catch((error) => {
                    console.error(`API call ${i} failed:`, error);
                    $scope.alertCountLoaders[i - 1] = false;
                })
                .finally(() => {
                    // do something if required
                });
        });
        
        // apiGateWay.get("/alerts_count", params).then(function (response) {
        //     if (response.data.status == 200) {
        //         $scope.alertCountData = response.data.data;
        //     }
        //     $scopealertCountLoaders = [false, false, false];
        // },
        // function (_error) {
        //     $scope.alertCountLoaders = [false, false, false];
        // });
        
    }
    
    $scope.setTitle = function (alertType) {
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
    $scope.getAlertTabName = function (alertType) {
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
    $scope.customerNote = '';
    $scope.alertTimeout = false;

    $scope.removeManager = function (jobId) {
        if ($scope.openedJobId == jobId) {
            $scope.openedJobId = $scope.openJobId = 0;
        }
        $scope.managerArray[jobId] = {};
        service.jobDetails[jobId] = false;
        $scope.showLoader[jobId] = false;
    }

    try {
        if ($rootScope.socket) {
            $rootScope.socket.on("manager_response", function (data) {
                if (data['success']) {
                    if ($scope.showLoader[data['jobId']] == false || $scope.showLoader[data['jobId']] == undefined) {
                        $scope.showLoader[data['jobId']] = true;
                        if (!$scope.$$phase) $scope.$apply();
                    }
                    if (data['jobAction'] == 'remove') {
                        //$scope.getJobList("pending");
                        $scope.removeManager(data['jobId']);
                    }
                    if (data['jobAction'] == 'add') {
                        //$scope.getJobList("pending");
                        if (data['removeJobId'] != 0) {
                            $scope.showLoader[data['removeJobId']] = true;
                            $scope.removeManager(data['removeJobId']);
                        }
                        $scope.managerArray[data['jobId']] = data['managerData'];
                        $scope.showLoader[data['jobId']] = false;
                        if (data['managerData'].managerId == $rootScope.userSession.userId && $scope.openedJobId == 0) {
                            angular.forEach($scope.jobList, function (value) {
                                if (value.jobId == data['jobId']) {

                                    $scope.openedJobId = $scope.openJobId = value.serviceManagerId;
                                    /* $scope.openJobDetails(value, ''); */
                                }
                            });
                        }

                    }
                    // setTimeout(function() {

                    // }, 100);
                } else {
                    if (data['jobAction'] == 'remove') {
                        //$scope.getJobList("pending");
                        //$scope.removeManager(data['jobId']);
                    }
                    $scope.showLoader[data['jobId']] = false;
                }
            });
        }
    } catch (error) {
    }
    
    $scope.showDot = [];
    $scope.showDot['client'] = [];
    $scope.showDot['system'] = []; 
    
    $scope.showFilter = function(){
        if($scope.showFilterBox){
            $scope.showFilterBox = false;
            return;
        }

        $scope.showFilterBox = true;
        document.onclick = function(e){
            if(e.target.id == 'backgroundOverlay'){
                $scope.showFilterBox = false;
            }
        }
    }
    
    $scope.clearFilter = function(){
        var filters = $scope.alertFilters;
        if(filters.TECHNICIANS.length > 0 || filters.ISSUE_REPORTS.length > 0 || filters.ALERTS.length > 0 || filters.CUSTOMER_TAG.length || filters.WATERDEVICE.length > 0){
            //if(confirm("Are you sure ?")){
            $scope.alertFilters = {"TECHNICIANS" : [], "ISSUE_REPORTS" : [], "ALERTS" : [], "CUSTOMER_TAG":[], "WATERDEVICE":[] };
                //  $scope.daySelected($scope.activeDayCount);
            //}            
        }
        $scope.getAlertList();
    }
    
    $scope.filterRouteResult = function(filterType, ID){
        var existingFilter = $scope.alertFilters[filterType];
        if(!existingFilter){
            return;
        }
        var idIndex = existingFilter.indexOf(ID);
        if(idIndex == -1){
            $scope.alertFilters[filterType].push(ID);            
        }else{
            $scope.alertFilters[filterType].splice(idIndex, 1);
        }
        $scope.currentPage = 1;
        $scope.showingFrom = 1;
        $scope.getAlertList();        
    }
      
    //to get alerts filter data
    $scope.getAlertFilterData = function() {
        $scope.isProcessing = true;
        apiGateWay.get("/alert_filter").then(function(response) {
              if (response.data.status == 200) {
                $scope.routesFilterList = response.data.data;
              }
              $scope.isProcessing = false;
            },
            function(error) {
                $scope.isProcessing = false;
            }
          );
      }
  
      $scope.openLink = (job) => { 
        if (job.isOneOfJob == 0) {
            if (job.deviceId == 0) {
                $state.go("app.customerwaterbodydetail", {
                    addressId: job.addressId,
                    jobId: job.jobId,
                    waterBodyId: job.waterBodyId
                })
            } else {
                $state.go('app.remotedatamonitoring', {
                    addressId: job.addressId,
                    dataId: job.deviceId,
                    deviceWaterBodyId: job.waterBodyId
                });
            }
        }
        if (job.isOneOfJob == 1) {
            $state.go("app.customerwaterbodydetail", {
                addressId: job.addressId,
                jobId: job.jobId
            })
        }
    }
    
    $scope.filterByTypes = function(type) {
        $scope.alertFilterEnabled = [1, 2, 3];
        if (type == 'Alerts') {
            $scope.statusCount[0].status = !$scope.statusCount[0].status;
        }
        
        if (type == 'Issue Reports') {
            $scope.statusCount[1].status = !$scope.statusCount[1].status;
        }
        
        if (type == 'Not Completed') {
            $scope.statusCount[2].status = !$scope.statusCount[2].status;
        }
        let actCount = 0;
        angular.forEach($scope.statusCount, (element) => {
           if (!element.status) {
            actCount = actCount +1;
           }  
        });
        if (actCount == 3) {
            if (type == 'Alerts') {
                $scope.statusCount[0].status = !$scope.statusCount[0].status;
            }
            
            if (type == 'Issue Reports') {
                $scope.statusCount[1].status = !$scope.statusCount[1].status;
            }
            
            if (type == 'Not Completed') {
                $scope.statusCount[2].status = !$scope.statusCount[2].status;
            }
        } else {
            $scope.currentPage = 1;
            $scope.showingFrom = 1;
            $scope.getAlertList();   
        }
    }
    
    $scope.dismissAlertConfirm = function(){
        if($scope.totalRecord == 0 || $scope.jobList.length < 1){
            return;
        }
        
        $scope.dismissAlertModal = ngDialog.open({
            template: 'dismissAllConfirm.html',
            className: 'ngdialog-theme-default',
            scope: $scope,
            preCloseCallback: function () {
                $scope.dismissMsg.msg = '';
                $scope.showDismissMsg = false;
            }
        });
    }
    
    $scope.confirmdismissAlertAction = function(){
        if ($scope.dismissMsg.msg.length == 0) {
            $scope.showDismissMsg = true;
            return;
        } else {
            $scope.showDismissMsg = false;
            $scope.alertIsLoading = true;
            var dismissPayload = {
                techniciansFilter: '',
                issueReportsFilter: '',
                alertsFilter: '',
                tagsFilter: '',
                waterDeviceFilter: '',
                reasonForDismiss: $scope.dismissMsg.msg,
                name: $scope.currentUser.firstName + ' ' + $scope.currentUser.lastName
            };
            angular.forEach($scope.statusCount, function(filter){
                if (filter.title == 'Alerts' && filter.status == false) {
                    dismissPayload.alertsOn = 1;
                }                 
                if (filter.title == 'Issue Reports' && filter.status == false) {
                    dismissPayload.issueReportsOn = 1;
                }                
                if (filter.title == 'Not Completed' && filter.status == false) {
                    dismissPayload.notCompletedOn = 1;
                }                
            });
            if ($scope.alertFilters.TECHNICIANS.length > 0) {
                dismissPayload.techniciansFilter = $scope.alertFilters.TECHNICIANS.toString();
            } else {
                delete dismissPayload.techniciansFilter;
            }

            if ($scope.alertFilters.ISSUE_REPORTS.length > 0) {
                dismissPayload.issueReportsFilter = $scope.alertFilters.ISSUE_REPORTS.toString();
            } else {
                delete dismissPayload.issueReportsFilter;
            }

            if ($scope.alertFilters.ALERTS.length > 0) {
                dismissPayload.alertsFilter = $scope.alertFilters.ALERTS.toString();
            } else {
                delete dismissPayload.alertsFilter;
            }
            if ($scope.alertFilters.CUSTOMER_TAG && $scope.alertFilters.CUSTOMER_TAG.length > 0) {
                dismissPayload.tagsFilter = $scope.alertFilters.CUSTOMER_TAG.toString();
            } else {
                delete dismissPayload.tagsFilter;
            }

            if ($scope.alertFilters.WATERDEVICE.length > 0) {
                dismissPayload.waterDeviceFilter = $scope.alertFilters.WATERDEVICE.toString();
            } else {
                delete dismissPayload.waterDeviceFilter;
            }
            apiGateWay.send("/dismiss_all_alerts", dismissPayload).then(function(response) {
                if (response.data.status == 200) {
                    $scope.dismissAlertModal.close();
                    $scope.getAlertList();
                }
                $scope.alertIsLoading = false;
            }, function(error){
                $scope.alertIsLoading = false;
            })
        }
    }
    
    $scope.resetFilter = () => {
        $scope.currentPage = 1;
        $scope.totalRecord = 0;
        $scope.totalPage = 0;
        $scope.alertParams.techniciansFilter = [];
        $scope.alertParams.issueReportsFilter = [];
        $scope.alertParams.alertFilters = [];
        $scope.alertParams.alertsOn = 0;
        $scope.alertParams.issueReportsOn = 0;
        $scope.alertParams.notCompletedOn = 0;
        $scope.alertFilters = {"TECHNICIANS" : [], "ISSUE_REPORTS" : [], "ALERTS" : [], "CUSTOMER_TAG": [], "WATERDEVICE":[]};
        
        angular.forEach($scope.statusCount, (filter) => {
            filter.status = true;
        });
        
        $scope.alertData = [];
        $scope.jobList = [];
        $scope.jobListArray = [];
        $scope.managerArray = [];
        $scope.alertIsLoading = true;
        $scope.getAlertList();
    } 

    $scope.saveFilterTemplateModel = {
        templateName: '',
    }
    $scope.routeTemplateFilterTemplateEndpoint = "/job_alerts_filter";
    $scope.routeTemplateFilterTemplatesFetching = true;
    $scope.routeTemplateFilterTemplatesUpdating = false;
    $scope.routeTemplateFilterTemplates = [];
    $scope.templateFilterSuccess = '';
    $scope.templateFilterError = '';
    $scope.getAllRouteFilterTemplates = function() {
        let payload = {
            getDefaultTemplate: false
        }
        apiGateWay.get($scope.routeTemplateFilterTemplateEndpoint, payload).then(function(response) {
            if (response.data.status == 200) {
                $scope.parseFitlerTemplates(response.data.data.Data, 'list');                                              
            }
            $scope.routeTemplateFilterTemplatesFetching = false;
        }, function(error){
            $scope.templateFilterError = 'Something went wrong. Unable to load filter templates.';
            $scope.routeTemplateFilterTemplatesFetching = false;
        })                 
    }
    $scope.getAllRouteFilterTemplates();
    $scope.parseFitlerTemplates = function(data, action) {
        $scope.routeTemplateFilterTemplates = [];
        if (data && data.constructor === Array) {
            if (data.length > 0) {                
                data.forEach(function(responseTemplate){
                    let template = {
                        id: responseTemplate.id,
                        templateName: responseTemplate.templateName,
                        techniciansFilter: responseTemplate.techniciansFilter,
                        issueReportsFilter: responseTemplate.issueReportsFilter,
                        tagsFilter: responseTemplate.tagsFilter,
                        alertsFilter: responseTemplate.alertsFilter,
                        techFilterData: responseTemplate.techFilterData,
                        waterDeviceFilter: responseTemplate.waterDeviceFilter,
                        isDefault: responseTemplate.isDefault,
                    }
                    $scope.routeTemplateFilterTemplates.push(template);
                })
            }
            if (action == 'add') {
                let template = $scope.getLatestCreatedTemplate();
                $scope.setSelecteRouteFilterTemplate(template, false);
            } 
            if (action == 'delete') {
                $scope.setSelecteRouteFilterTemplate($scope.noneRouteFilterTemplate);
            }
        }     
    }
    $scope.getLatestCreatedTemplate = function() {
        let data = angular.copy($scope.routeTemplateFilterTemplates)
        data = data.sort((a, b) => b.id - a.id);
        const latestTemplate = data[0];
        return latestTemplate;
    }
    $scope.noRouteFilterSelected = function() {
        let filters = $scope.alertFilters;
        return (filters.TECHNICIANS.length == 0 && filters.ISSUE_REPORTS.length == 0 && filters.ALERTS.length == 0 && (filters.CUSTOMER_TAG && filters.CUSTOMER_TAG.length == 0) && filters.WATERDEVICE.length == 0)
    }

    $scope.clearFilter = function(){
        var filters = $scope.alertFilters;
        if(filters.TECHNICIANS.length > 0 || filters.ISSUE_REPORTS.length > 0 || filters.ALERTS.length > 0 || filters.CUSTOMER_TAG.length > 0|| filters.WATERDEVICE.length > 0){
            $scope.alertFilters = {"TECHNICIANS" : [], "ISSUE_REPORTS" : [], "ALERTS" : [], "CUSTOMER_TAG" : [], "WATERDEVICE" : []};
        }
        $scope.selectedCustomerTags = [];
        $scope.setSelecteRouteFilterTemplate($scope.noneRouteFilterTemplate);
    }

    $scope.selectedRouteFilterTemplate = $scope.noneRouteFilterTemplate;
    $scope.setSelecteRouteFilterTemplate = function(template) {       
        $scope.selectedRouteFilterTemplate = template;
         // Handle both single and comma-separated values
        $scope.alertFilters["TECHNICIANS"] = Array.isArray(template.techniciansFilter) && template.techniciansFilter.length > 0
        ? template.techniciansFilter.map(Number) : template.techniciansFilter && typeof template.techniciansFilter === 'string'
        ? template.techniciansFilter.split(',').map(Number) : [];
        
        $scope.alertFilters["ISSUE_REPORTS"] = Array.isArray(template.issueReportsFilter) && template.issueReportsFilter.length > 0
        ? template.issueReportsFilter : template.issueReportsFilter && typeof template.issueReportsFilter === 'string'
        ? template.issueReportsFilter.split(',') : [];
        
        $scope.alertFilters["ALERTS"] = Array.isArray(template.alertsFilter) && template.alertsFilter.length > 0
        ? template.alertsFilter : template.alertsFilter && typeof template.alertsFilter === 'string'
        ? template.alertsFilter.split(',') : [];
            
        if (template.tagsFilter && (Array.isArray(template.tagsFilter) || typeof template.tagsFilter === 'string')) {
            const tags = typeof template.tagsFilter === 'string'
                ? template.tagsFilter.split(',').map(tag => tag.trim()) // Split and trim if it's a string
                : template.tagsFilter; // If it's already an array, use it directly
            $scope.renderTagsFromFilterTemplate(tags);
        } else {
            $scope.alertFilters["CUSTOMER_TAG"] = [];
            $scope.selectedCustomerTags = [];
        }
        
        $scope.alertFilters["WATERDEVICE"] = Array.isArray(template.waterDeviceFilter) && template.waterDeviceFilter.length > 0
        ? template.waterDeviceFilter : template.waterDeviceFilter && typeof template.waterDeviceFilter === 'string'
        ? template.waterDeviceFilter.split(',') : [];
        
        $scope.getAlertList();
    }
    $scope.newRouteFilterTemplateNameModal = null;
    $scope.openNewRouteFilterTemplateForm = function() {
        $scope.newRouteFilterTemplateNameModal = ngDialog.open({            
            template: 'newRouteFilterTemplateNameModal.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function() {     
                $scope.saveFilterTemplateModel.templateName = '';
            }
        });
    }
    $scope.getFilterFromPage = function(type) {
        let filters = [];
        if (type == 'TECHNICIANS') { 
            filters = $scope.alertFilters["TECHNICIANS"];
            filters.sort((a, b) => a - b);
        }
        if (type == 'ISSUE_REPORTS') { 
            filters = $scope.alertFilters["ISSUE_REPORTS"];
            filters.sort((a, b) => a - b);
        }
        if (type == 'ALERTS') { 
            filters = $scope.alertFilters["ALERTS"];
            filters.sort((a, b) => a - b);
        }
        if (type == 'CUSTOMER_TAG') { 
            filters = $scope.alertFilters["CUSTOMER_TAG"];
            filters.sort((a, b) => a.localeCompare(b));
        }
        if (type == 'WATERDEVICE') { 
            filters = $scope.alertFilters["WATERDEVICE"];
            filters.sort((a, b) => a - b);
        }
        return filters
    }
    $scope.checkTemplateNameExists = function(name) {
        return $scope.routeTemplateFilterTemplates.findIndex(template => template.templateName.toLowerCase() === name.toLowerCase()) !== -1        
    }
    $scope.createNewRouteFilterTemplate = function() {
        if (!$scope.saveFilterTemplateModel.templateName || $scope.saveFilterTemplateModel.templateName == '') {
            return
        }        
        if ($scope.checkTemplateNameExists($scope.saveFilterTemplateModel.templateName)) {
            $scope.templateFilterError = 'Template name already exist.';
            $timeout(() => { $scope.templateFilterError = ''; }, 2000)
            return
        }
        $scope.routeTemplateFilterTemplatesUpdating = true;
        let payload = {
            action: "add",
            templateName: $scope.saveFilterTemplateModel.templateName,
            techniciansFilter: $scope.getFilterFromPage("TECHNICIANS").toString(),
            issueReportsFilter: $scope.getFilterFromPage("ISSUE_REPORTS").toString(),
            alertsFilter: $scope.getFilterFromPage("ALERTS").toString(),
            tagsFilter: $scope.getFilterFromPage("CUSTOMER_TAG").toString(),
            waterDeviceFilter: $scope.getFilterFromPage("WATERDEVICE").toString(),
            isDefault: 0,
        }
        apiGateWay.send($scope.routeTemplateFilterTemplateEndpoint, payload).then(function(response) {
            if (response.data.status == 200) {
                if (response.data.message == 'Alert Filters Already exist!') {
                    $scope.templateFilterError = 'Alert Filters Already exist: ' + response.data.data['Template name'];
                    $timeout(()=>{$scope.templateFilterError=''},2000);
                    $scope.routeTemplateFilterTemplatesUpdating = false;
                    return
                }
                let templateRecieved = response.data.data.Data || [];
                $scope.parseFitlerTemplates(templateRecieved, 'add');
                $scope.routeTemplateFilterTemplatesUpdating = false;
                $scope.newRouteFilterTemplateNameModal.close();
            } else {
                $scope.templateFilterError = response.data.message;
                $timeout(()=>{$scope.templateFilterError=''},2000);
            }
            $scope.routeTemplateFilterTemplatesUpdating = false;
        }, function(error){
            $scope.templateFilterError = typeof error == 'string' ? error : 'Something went wrong.';
            $timeout(()=>{$scope.templateFilterError=''},2000);
            $scope.routeTemplateFilterTemplatesUpdating = false;
        })
    }
    // 
    $scope.allCustomerTags = [];
    $scope.getAllCustomerTags = function() {  
        $scope.allCustomerTags = [];      
        $scope.isAllCustomerTagLoading = true;       
        apiGateWay.get('/get_tags_by_company').then(function(response) {
            if (response.data.status == 200) {
                let allTags = [];
                if (response.data.data && response.data.data.tags && response.data.data.tags.length > 0) {
                    let _tags = response.data.data.tags;
                    _tags.forEach(function(tag){
                        let formattedTag = tag.trim();
                        if (!allTags.some(existingTag => existingTag.toLowerCase() === formattedTag.toLowerCase())) {
                            allTags.push(formattedTag);
                        }
                    });
                }
                $scope.allCustomerTags = allTags;                
            }
            $scope.isAllCustomerTagLoading = false;
        }, function(error){
            $scope.isAllCustomerTagLoading = false;
        })        
    }
    $scope.searchTextTag = '';
    $scope.filteredTags = function() {
        $scope.searchTextTag = $(document).find('#customerTagSearchRoute').val();
        var filter = $scope.searchTextTag.trim().toUpperCase();
        return $scope.allCustomerTags.filter(function(tag) {            
            var tagUpperCase = tag.toUpperCase();            
            return tagUpperCase.indexOf(filter) !== -1 && ($scope.selectedCustomerTags && !$scope.selectedCustomerTags.includes(tag));
        });
    };
    $scope.isCustomerTagListShown = false;
    $scope.toggleCustomerTagList = function(type) {
        if (type == 'open') {
            $scope.isCustomerTagListShown = true;
        }
        if (type == 'close') {
            $scope.isCustomerTagListShown = false;
        }
    }
    $scope.selectedCustomerTags = [];
    $scope.addTagTofilter = function(tag) {
        let t = angular.copy($scope.selectedCustomerTags)
        $scope.selectedCustomerTags = [];
        if (!$scope.selectedCustomerTags.includes(tag)) {
            $scope.selectedCustomerTags = t;
            $scope.selectedCustomerTags.push(tag)
        }
        // $scope.toggleCustomerTagList('close');
        $scope.filterRouteResult('CUSTOMER_TAG', tag);
        $scope.searchTextTag = '';
    }
    $scope.removeTagFromFilter = function(tag) {
        $scope.selectedCustomerTags = $scope.selectedCustomerTags.filter(function(selectedTag) {
            return selectedTag !== tag;
        });        
        $scope.filterRouteResult('CUSTOMER_TAG', tag)
    }
    $scope.getAllCustomerTags(); 
    $scope.renderTagsFromFilterTemplate = function(tags) {
        $scope.selectedCustomerTags = [];
        if (tags && tags.length > 0) {
            tags.forEach(function(tag){
                $scope.selectedCustomerTags.push(tag);
                // $rootScope.filters["CUSTOMER_TAG"] = $scope.selectedCustomerTags;
                // if ($scope.allCustomerTags.includes(tag)) {                    
                //     if ($scope.selectedCustomerTags.indexOf(tag) === -1) {
                //     }
                // }
            })
        }
        $scope.alertFilters["CUSTOMER_TAG"] = $scope.selectedCustomerTags;
    }
    $scope.deleteRouteFilterTemplateConfirmModal = null;
    $scope.confirmRouteFilterTemplateDelete = function() {
        $scope.deleteRouteFilterTemplateConfirmModal = ngDialog.open({            
            template: 'deleteRouteFilterTemplateConfirmModal.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function() {     
                
            }
        });
    } 
    $scope.deleteRouteFilterTemplate = function() {                
        $scope.routeTemplateFilterTemplatesUpdating = true;
        let payload = {
            action: "delete",
            templateId: $scope.selectedRouteFilterTemplate.id            
        }
        apiGateWay.send($scope.routeTemplateFilterTemplateEndpoint, payload).then(function(response) {
            if (response.data.status == 200) {
                if ($scope.selectedRouteFilterTemplate.isDefault) {
                    auth.deleteStorage('defaultAlertFilterTemplateSession');
                }
                let templateRecieved = response.data.data.Data || [];
                $scope.parseFitlerTemplates(templateRecieved, 'delete')
                $scope.deleteRouteFilterTemplateConfirmModal.close();                  
            }
            $scope.routeTemplateFilterTemplatesUpdating = false;
        }, function(error){
            $scope.templateFilterError = typeof error == 'string' ? error : 'Something went wrong.';
            $timeout(()=>{$scope.templateFilterError=''},2000);
            $scope.routeTemplateFilterTemplatesUpdating = false;
        })    
    }
    $scope.changeDefaultRouteFilterTemplate = function() { 
        $scope.selectedRouteFilterTemplate.isDefault = $scope.defaultRouteFilterTemplateAction == 'set' ? 1 : 0;
        $scope.routeTemplateFilterTemplatesUpdating = true;
        let payload = {
            action: "update",
            templateId: $scope.selectedRouteFilterTemplate.id,
            isDefault: $scope.selectedRouteFilterTemplate.isDefault
        }
        if (payload.templateId == 0 && payload.isDefault == 1) {
            let defaultTemplate = $scope.routeTemplateFilterTemplates.find(template => template.isDefault === 1);
            auth.setStorage('defaultAlertFilterTemplateSession', $scope.selectedRouteFilterTemplate);
            if (defaultTemplate) {
                payload.templateId = defaultTemplate.id;
                payload.isDefault = 0;
            } else {
                auth.deleteStorage('defaultAlertFilterTemplateSession');
                $scope.routeTemplateFilterTemplatesUpdating = false; 
                $scope.defaultRouteFilterTemplateConfirmModal.close();
                return
            }
        }
        apiGateWay.send($scope.routeTemplateFilterTemplateEndpoint, payload).then(function(response) {
            if (response.data.status == 200) {
                auth.deleteStorage('defaultAlertFilterTemplateSession');
                if (payload.isDefault) {
                    auth.setStorage('defaultAlertFilterTemplateSession', $scope.selectedRouteFilterTemplate)
                }
                let templateRecieved = response.data.data.Data || [];
                $scope.parseFitlerTemplates(templateRecieved, 'update')
                $scope.defaultRouteFilterTemplateConfirmModal.close();              
            }
            $scope.routeTemplateFilterTemplatesUpdating = false;
        }, function(error){
            $scope.templateFilterError = typeof error == 'string' ? error : 'Something went wrong.';
            $timeout(()=>{$scope.templateFilterError=''},2000);
            $scope.routeTemplateFilterTemplatesUpdating = false;
        })    
    }
    $scope.defaultRouteFilterTemplateConfirmModal = null;
    $scope.defaultRouteFilterTemplateAction = null;
    $scope.confirmRouteFilterTemplateDefault = function(type) {
        $scope.defaultRouteFilterTemplateAction = type;
        $scope.defaultRouteFilterTemplateConfirmModal = ngDialog.open({            
            template: 'defaultRouteFilterTemplateConfirmModal.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function() {     
                $scope.defaultRouteFilterTemplateAction = null;
            }
        });
    } 
    if ($rootScope.defaultAlertFilterTemplate) {
        $scope.setSelecteRouteFilterTemplate($rootScope.defaultAlertFilterTemplate, false)
    } 
});
