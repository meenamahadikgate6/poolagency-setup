angular.module('POOLAGENCY').controller('technicianDetailController', function($scope,$state,deviceDetector, auth, $timeout, ngDialog, $rootScope, $filter, $sce, apiGateWay, service, $stateParams, AwsS3Utility, AwsConfigService, configConstant) {
    $scope.technicianId = $stateParams.technicianId;
    $scope.selectDate = '';
    $scope.currentPage = 1;
    $scope.limit = 10;
    $scope.dir = 'desc';
    $scope.column = 'createTime';
    $scope.isProcessing = false;
    $scope.chlorineData = [];
    $scope.phData = [];
    $scope.jobData = [];
    $scope.filterPsiData = [];
    $scope.alertCountData = [];
    $scope.addressJobDetails = [];
    $scope.loggedInRole = auth.loggedInRole();
    $scope.showPie = false;
    $scope.showAlertPie = true;
    $scope.pieChemicalCostData = [];
    $scope.techRatingList = [];
    $scope.totalRecord = 0;
    $rootScope.hasFeedback = true;
    $scope.gridType = 'jobhistory';
    $scope.reviewLengthOnGrid = 60;
    $scope.showfuturedata = 1;
    $scope.isTechnicianPage = true;
    $scope.selectedEvn = configConstant.currEnvironment;
    $scope.env = configConstant[$scope.selectedEvn];
    $scope.vehicleSearchBox = {searchText:''};
    $scope.vehicleSearchText = ''
    $scope.successMessage = '';
    $scope.errorMessage = '';
    $scope.awsCDNpath = '';
    $scope.isExpanded = false;
    $scope.truckImageProcessing = {};
    $scope.imageIndex = 0;
    $scope.truckImageAwsPath = $scope.env.awsAssetsPrefix + $scope.env.awsAssetsPathInventoryTrucks + $rootScope.userSession.companyId+'/'; 
    $scope.initAws = function() {
      AwsConfigService.fetchAwsConfig().then(function(config) { 
        $scope.awsCDNpath = config.domain;
      });
    }
    $timeout(function() {
      $scope.initAws();
    }, 1000);
    $scope.jobRangeFilterData = [
      {'title': 'CUSTOM', value: true, type: 'custom' },
      {'title': '1 WEEK', value: 1, type: 'week' },
      {'title': '1 MONTH', value: 1, type: 'month' },
      {'title': '90 DAYS', value: 90, type: 'days' },
      {'title': '1 YEAR', value: 1, type: 'year' },
    ]

    $scope.filterRangeSelected = 2;

    $scope.jobFilter = {
        'RoutedJob' : true,
        'OneOfJob' : true
    }
    $scope.searchText = ""
    $scope.reportMode = 'spent';        
    $scope.reportModeDDValue = $scope.reportMode;  
    $scope.hideShowDatesText = 'Hide future dates';
    $scope.hideShownDatesText = true;

    $scope.reportModeChange = function(e) {
      if($scope.reportMode != e.target.value) {
        $scope.reportMode = e.target.value;
        $scope.getChemicalCost()
      }
    }
    $scope.goToDetail = function(job,isOneOfJob) {
      if (event.ctrlKey || event.metaKey){
          if (isOneOfJob==1){
            var url = "/app/one-time-job/"+job.addressId+'/'+job.jobId;
          }
          else{
            var url = "/app/customerjobdetail/"+job.addressId+'/'+job.jobId;
          }
          
          window.open(url,'_blank');
      }else{
          if (isOneOfJob==1){
              $state.go("app.onetimejob",{"addressId":job.addressId,"jobId":job.jobId}, {reload: true});
          }
          else{
              $state.go("app.customerjobdetail",{"addressId":job.addressId,"jobId":job.jobId}, {reload: true});
          }
          
      }  
  };
    //to get technician job list
    $scope.getTechnicianJobList = function() {
        $scope.isProcessing = true;
        $scope.openCloseReadMore(false);
        var jobParam = {
            page: $scope.currentPage - 1,
            length: $scope.limit,
            dir: $scope.dir,
            column: $scope.column,
            technicianId: $scope.technicianId,
            showAllAlerts: true,
            searchText: $scope.searchText,
            showfuturedata: $scope.showfuturedata
        };
        $scope.page =$scope.currentPage;
        dateType = $scope.jobRangeFilterData[$scope.filterRangeSelected].type

        if (dateType == 'custom' && $scope.dateRangeModel.jobFromDate != '' && $scope.dateRangeModel.jobToDate != '') {
          jobParam.startDate = $filter('date')(new Date($scope.dateRangeModel.jobFromDate), 'yyyy-MM-dd');
          jobParam.endDate = $filter('date')(new Date($scope.dateRangeModel.jobToDate), 'yyyy-MM-dd');
        } else {
          dateValue = $scope.jobRangeFilterData[$scope.filterRangeSelected].value
          if(dateType != 'custom') {
            jobParam.startDate = $filter('date')(new Date(moment().subtract(dateValue, dateType)), 'yyyy-MM-dd');
            jobParam.endDate = $filter('date')(new Date(moment()), 'yyyy-MM-dd');
          }
        }

        if($scope.gridType == 'jobhistory') {
          if($scope.jobFilter.RoutedJob == false && $scope.jobFilter.OneOfJob == true){
              jobParam.isOneOfJob = 1
          }
          if($scope.jobFilter.RoutedJob == true && $scope.jobFilter.OneOfJob == false){
              jobParam.isOneOfJob = 0
          }
        }
        
        var endPoint = $scope.gridType == 'jobhistory' ? "/job" : "/feedback";

        apiGateWay.get(endPoint, jobParam).then(function(response) {
            if (response.data.status == 200) {
                var jobListResponse = response.data.data;
                $scope.jobListResponse = jobListResponse;
                $scope.totalRecord = jobListResponse.rows;
                $scope.routeCount = jobListResponse.routeCount;
                $scope.oneOfJobCount = jobListResponse.oneOfJobCount;
                $scope.totalPage = ($scope.totalRecord % $scope.limit) !== 0 ? parseInt($scope.totalRecord / $scope.limit) : parseInt(($scope.totalRecord / $scope.limit)) - 1;
                $scope.dataList = jobListResponse.data;
            } else {
                $scope.dataList = [];
            }
            $scope.isProcessing = false;
        }, function(err){
          $scope.dataList = [];
          $scope.isProcessing = false;
        });
    };

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

    $scope.changeGridType = function(gridType){
        if (gridType === 'quotes') {
          $scope.gridType = gridType;
          $rootScope.listingTab[gridType]=true; 
        } else {
          $scope.gridType = gridType;
          $scope.currentPage = 1;
          $scope.getTechnicianJobList();
        }
    }

    $scope.remoreReview = false;
    $scope.titleName = '';
    $scope.openCloseReadMore = function(reviewObj){
        $scope.remoreReview = reviewObj ? reviewObj.review : false;
        $scope.linkAddressId = reviewObj.addressId ? reviewObj.addressId : false;
        $scope.linkJobId = reviewObj.jobId? reviewObj.jobId : false;;
        $scope.titleName = reviewObj ? (reviewObj.customerName ? reviewObj.customerName : reviewObj.managerName) : false;
        $scope.isOneOfJob = reviewObj.isOneOfJob;
    }


    $scope.techMeidDeviceLoading = false;
    $scope.techMeidDevice = '';
    var getTechMeidDevice = function(){
      $scope.techMeidDeviceLoading = true;
      apiGateWay.get("/tech_meid_device", {techId: $scope.technicianId}).then(function(response) {

          if (response.data.status == 200) {
              $scope.techMeidDevice = response.data.data;
          } else {
            $scope.techMeidDevice = '';
          }
          $scope.techMeidDeviceLoading = false;
      }, function(){
        $scope.techMeidDevice = '';
        $scope.techMeidDeviceLoading = false;
      });
    }
    //getTechMeidDevice();

    //to get meid list
    $scope.meidListResponse = [];
    $scope.assignmentModel = {meidDevice: ''};
    var getMeidList = function() {
      /* $scope.isProcessing = true;
      apiGateWay.get("/meid", {offset: 0,limit: 100}).then(function(response) {
            $scope.meidList = [];
            if (response.data.status == 200) {
              $scope.meidListResponse = response.data.data;
            } else {
              $scope.meidListResponse = [];
            }
            $scope.isProcessing = false;
          },function(error) {
            $scope.meidListResponse = [];
            $scope.isProcessing = false;
          }); */
    };

    $scope.freeDeviceList = [];
    var getDeviceList = function(){
      apiGateWay.get("/company/devices", {type: 'all'}).then(function(response) {
          if (response.data.status == '200') {
              responseData = response.data.data;
              $scope.freeDeviceList = responseData.freeDeviceList;
          }
      });
    }
    //getDeviceList();

    //to show chemical cost on dialog
    /* $scope.assignMeidDeviceModal = function(type, dataObj) {
        $scope.type = type;
        $scope.assignmentModel.meidDevice = '';
        $scope.dataObj = dataObj;
        $scope.assignmentDialog = ngDialog.open({
            template: 'assignMeidDeviceModal.html',
            className: 'ngdialog-theme-default',
            scope: $scope,
            preCloseCallback: function() {
              $scope.type = '';
              $scope.dataObj = '';
            }
        });
        if(type=='meid'){
          getMeidList();
        }else{

        }
    }; */

    $scope.assignMeidDevice = function(dataObj, type){
        $scope.isMeidDeviceProcessing = true;
        $scope.techMeidDeviceSuccess = {device: '', meid: ''}
        $scope.techMeidDeviceError = {device: '', meid: ''}
        var endPoint = "/assign_device_tech";
        var params = {};
        if($scope.type=='meid'){
          endPoint = "/assign_meid_tech"
          params = {techUserId: dataObj.userId, meid: $scope.assignmentModel.meidDevice};
        }else{
          params = {techUserId: $scope.technicianId, deviceCompId: $scope.assignmentModel.meidDevice};
        }
        apiGateWay.send(endPoint, params).then(function(response) {
          $scope.meidList = [];
          if (response.data.status == 200) {
            getTechMeidDevice();
            $scope.techMeidDeviceSuccess[type] = response.data.message;
            $scope.techMeidDeviceError[type] = '';
            setTimeout(function() {
              $scope.techMeidDeviceSuccess[type] = "";
              if (!$scope.$$phase) $scope.$apply();
            }, 2000);

            $scope.assignmentDialog.close();
          }else{
            $scope.techMeidDeviceError[type] = response.data.message;
            setTimeout(function() {
              $scope.techMeidDeviceError[type] = "";
              if (!$scope.$$phase) $scope.$apply();
            }, 2000);
            if (!$scope.$$phase) $scope.$apply();
            $scope.techMeidDeviceSuccess[type] = '';
          }
          $scope.isMeidDeviceProcessing = false;
        },function(error) {
          $scope.isMeidDeviceProcessing = false;
        });
    }


    $scope.removeMeidDevice = function(dataObj, type){
      $scope.techMeidDeviceSuccess = {device: '', meid: ''};
      $scope.techMeidDeviceError = {device: '', meid: ''};
      if(confirm('Are you sure, you want to remove '+(type == 'meid' ? 'MEID' : 'Device')+' from technician?')){
          $scope.isProcessing = true;
          apiGateWay.send("/remove_meid_device_tech", {type: type, techUserId: $scope.technicianId, deviceTechMapId: dataObj.deviceTechMapId}).then(function(response) {
            $scope.meidList = [];
            if (response.data.status == 200) {
              getTechMeidDevice();
              $scope.techMeidDeviceSuccess[type] = response.data.message;
              $scope.techMeidDeviceError[type] = '';
              setTimeout(function() {
                $scope.techMeidDeviceSuccess[type] = "";
                if (!$scope.$$phase) $scope.$apply();
              }, 2000);
            }else{
              $scope.techMeidDeviceError[type] = response.data.message;
              setTimeout(function() {
                $scope.techMeidDeviceError[type] = "";
                if (!$scope.$$phase) $scope.$apply();
              }, 2000);
              if (!$scope.$$phase) $scope.$apply();
              $scope.techMeidDeviceSuccess[type] = '';
            }
            $scope.isProcessing = false;
          },function(error) {
            $scope.isProcessing = false;
          });
      }
    }



    //pagination case
    $scope.goToTechnicianJobListPage = function(page) {
        $scope.currentPage = page;
        $scope.getTechnicianJobList();
    };
    $scope.filterModel = {filterMonth: '90 days', filterMonthAlert: '90 days', statsFilterMonth: '90 days'};

    $scope.filterMonthObj2 = {
        filterMonth: '1 month'
    };
    $scope.filterGraphData = ['custom','1 month','90 days', '6 months', '1 year'];

    $scope.filterGraph = function(section) {
      $scope.dateRangeModel[section+'FromDate'] = '';
      $scope.dateRangeModel[section+'ToDate'] = '';
      if(section == 'stat' && $scope.filterModel.statsFilterMonth!='custom'){
        $scope.technicianStats();
      } else if(section == 'alert' && $scope.filterModel.filterMonthAlert!='custom'){
        $scope.getTechnicianInfo();
      } else if(section == 'chemical' && $scope.filterModel.filterMonth!='custom'){
        $scope.getChemicalCost();
      } 
    };

    $(document).ready(function() {
        $('.input-daterange').datepicker({
            autoclose: true,
            // endDate: moment().format('MM-YYYY'),
            todayBtn: "linked"
        });
    });
    $rootScope.$on('ngDialog.opened', function (e, $dialog) {
      if($dialog.name === 'chemicalCost' || $dialog.name === 'alertTrend'){
        setTimeout(function(){
          $('.input-daterange').datepicker({
            autoclose: true,
            endDate: moment().format('MM-YYYY'),
            todayBtn: "linked"
          });
        }, 200);
      }
    });
    $scope.dateRangeModel = {
      jobFromDate: "",
      jobToDate: "",
      statFromDate: "",
      statToDate: "",
      alertFromDate: "",
      alertToDate: "",
      chemicalFromDate: "",
      chemicalToDate: "",
    }
    
    //to filter technician jobs by date
    $scope.filterByDate = function(p, section) {
        if ($scope.dateRangeModel[section+'FromDate'] != '' && $scope.dateRangeModel[section+'ToDate'] != '') {
            var fromDateValue = new Date($scope.dateRangeModel[section+'FromDate']);
            var toDateValue = new Date($scope.dateRangeModel[section+'ToDate']);
            if (fromDateValue <= toDateValue) {
              if(section == 'stat'){
                $scope.filterModel.statsFilterMonth = 'custom';
                $scope.technicianStats();
              } else if(section == 'alert'){
                $scope.filterModel.filterMonthAlert = 'custom';
                $scope.getTechnicianInfo();
              } else if(section == 'chemical'){
                $scope.filterModel.filterMonth = 'custom';
                $scope.getChemicalCost();
              } else {              
                $scope.currentPage = 1;
                $scope.getTechnicianJobList();
              }
            } else {
                //alert("From date should be smaller than to date");
                if (p == 'fromDate') {
                    $scope.dateRangeModel[section+'FromDate'] = '';
                } else {
                    $scope.dateRangeModel[section+'ToDate'] = '';
                }
            }
        } else {
            if ($scope.dateRangeModel[section+'FromDate'] == '' && $scope.dateRangeModel[section+'ToDate'] == '') {

              if(section == 'stat'){
                $scope.technicianStats();
              } else if(section == 'alert'){
                $scope.getTechnicianInfo();
              } else if(section == 'chemical'){
                $scope.getChemicalCost();
              } else {              
                $scope.getTechnicianJobList();
              }
                
            }
        }
    };
    $scope.clickDate = function(event) {
        angular.element(document.getElementsByClassName('currentDateCalendar')).removeClass('currentDateCalendar');
        angular.element(event.target.parentNode).addClass('currentDateCalendar');
    }

    $scope.pieAlertTrendData = [];
    $scope.dueDate = [];
    $scope.alertCountData = [];

    $scope.totalProgressTileCount = new Array(25);
    $scope.ratingType = 'positive';
    $scope.ratingCount = 0;
    $scope.JobIds = {"Alerts":{},  "Series 1": {}};
    //to get technican info data
    $scope.getTechnicianInfo = function() {
        $scope.isProcessing = true;
        var pdata = {
            userId: $scope.technicianId,
            filterMonth: $scope.filterModel.filterMonthAlert,
            onSite: '',
            rowCount: 0
        };
        if ($scope.dateRangeModel.alertFromDate != '' && $scope.dateRangeModel.alertToDate != '') {
          pdata.startDate = $filter('date')(new Date($scope.dateRangeModel.alertFromDate), 'yyyy-MM-dd');
          pdata.endDate = $filter('date')(new Date($scope.dateRangeModel.alertToDate), 'yyyy-MM-dd');
        }
        $scope.openCloseReadMore(false);

        apiGateWay.get("/technicians_detail", pdata).then(function(response) {
            if (response.data) {
                if (response.data.status == 200) {
                    $scope.technicianinfo = response.data.data;                    
                    $rootScope.title = $scope.technicianinfo.firstName + ' ' + $scope.technicianinfo.lastName;
                    $rootScope.techName = $scope.technicianinfo.firstName + ' ' + $scope.technicianinfo.lastName;
                    $scope.technicianinfo.userImage = ($scope.technicianinfo.userImage != '') ? $scope.technicianinfo.userImage : '';
                    $rootScope.techPayrollId = $scope.technicianinfo.payrollId;
                    var ratingObj =  $scope.technicianinfo.rating;
                    $rootScope.techRating = {
                        'up': ratingObj && ratingObj.up ? ratingObj.up : 0,
                        'down': ratingObj && ratingObj.down ? ratingObj.down : 0
                    }
                    if (Number(ratingObj.up) > 0 && Number(ratingObj.down) > 0) {
                      $rootScope.hasFeedback = true;                      
                    }
                    if (Number(ratingObj.up) > 0 && Number(ratingObj.down) == 0) {
                      $rootScope.hasFeedback = true;
                    }
                    if (Number(ratingObj.up) == 0 && Number(ratingObj.down) > 0) {
                      $rootScope.hasFeedback = true;
                    }
                    if (Number(ratingObj.up) == 0 && Number(ratingObj.down) == 0) {
                      $rootScope.hasFeedback = false;
                    }
                    $scope.ratingType = ($rootScope.techRating.up - $rootScope.techRating.down > 0) ? 'positive' : 'negative';
                    $scope.ratingCount = Math.abs($rootScope.techRating.up - $rootScope.techRating.down);
                    // show pie chart based on rating
                    if ($rootScope.hasFeedback) {
                      $scope.generateFeedbackChart();
                    }

                    if($scope.technicianinfo.pieAlertTrend){

                      var result = $scope.technicianinfo.pieAlertTrend.sort(function(a, b) {
                          return parseFloat(a.alertCount) - parseFloat(b.alertCount);
                      });

                      $scope.pieAlertTrendData = angular.copy(result);

                      $scope.pieAlertTrendData = [];
                      angular.forEach(result, function(gdata) {
                          $scope.pieAlertTrendData.push({'name': gdata['title'], 'y': gdata['alertCount']});
                      });

                    }




                    if($scope.technicianinfo.alertData){
                      $scope.alertCountData = [];
                      $scope.dueDate = [];
                      angular.forEach($scope.technicianinfo.alertData, function(element, key){
                          var graphDate = $filter('date')(element.dueDate, 'MM/dd/yyyy');
                          $scope.JobIds['Alerts'][graphDate +"-"+element.alertCount] = element;
                          $scope.alertCountData.push(element.alertCount);
                          $scope.dueDate.push(graphDate)
                      });
                    }

                    setTimeout(function(){
                        $scope.getGraph('PIEALERTTREND', 'ALERT TREND');
                        $scope.getGraph('ALERTTREND', 'ALERT TREND');
                        $scope.getGraph('ALERTTRENDMODEL', 'ALERT TREND');
                        $scope.getGraph('PIEALERTTRENDMODEL', 'ALERT TREND');

                        var offsetHeight = document.getElementById('infotechnician').offsetHeight;
                        document.getElementById('infostatstechnician').style.height = offsetHeight+'px';
                    }, 2000);
                    $rootScope.getTechRole($scope.technicianinfo.techRoleId ? $scope.technicianinfo.techRoleId : '');
                   
                    
                  
                } else {
                    $scope.technicianinfo = [];
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
            var offsetHeight = document.getElementById('infotechnician').offsetHeight;
                       document.getElementById('infostatstechnician').style.height = offsetHeight+'px';
            $rootScope.storeAnalytics('Error - Get Technician Info', "Error on getTechnicianInfo - " + currentDateTime, analyticsDataString, 0, true);
        });
    };

    $scope.jobTimining = {
      avgStartTime: "--:--",
      avgEndTime: "--:--",
      onSite: "--:--",
      rowCount: 0
    }
    $scope.techStatsProgress = false;
    $scope.technicianStats = function(){

        var payload = {
          userId: $scope.technicianId,
          statsFilterMonth: $scope.filterModel.statsFilterMonth
        }
        if ($scope.dateRangeModel.statFromDate != '' && $scope.dateRangeModel.statToDate != '') {
          payload.startDate = $filter('date')(new Date($scope.dateRangeModel.statFromDate), 'yyyy-MM-dd');
          payload.endDate = $filter('date')(new Date($scope.dateRangeModel.statToDate), 'yyyy-MM-dd');
        }
        $scope.techStatsProgress = true;
        apiGateWay.get("/technicians_stats", payload).then(function(response) {
            if(response.data.status == 200){
              var responseData = response.data;
              if(responseData.data && responseData.data.rowCount > 0){

                  var d = new Date();

                  var month = (parseInt(d.getMonth())+1);
                  month = month < 10 ? "0"+month : month;
                  var day = d.getDate();
                  day = day < 10 ? "0"+day : day;
                  var dateStr = d.getFullYear()+'-'+month+'-'+day;
                  
                  // calculate AVG time on site
                  //var avgStartTime = new Date(dateStr+" "+responseData.data.avgStartTime);
                  //var avgEndTime = new Date(dateStr+" "+responseData.data.avgEndTime);
                  
                  // calculate AVG start and End time

                  var startDateTime = new Date(dateStr+" "+responseData.data.minStartTime);
                  var endDateTime = new Date(dateStr+" "+responseData.data.maxEndTime);



                  var startHour = startDateTime.getHours() < 10 ? "0"+startDateTime.getHours(): startDateTime.getHours();
                  var startMinut = startDateTime.getMinutes() < 10 ? "0"+startDateTime.getMinutes(): startDateTime.getMinutes();
                  var startSecond = startDateTime.getSeconds() < 10 ? "0"+startDateTime.getSeconds(): startDateTime.getSeconds();

                  startDateTime = new Date(dateStr+"T"+startHour+":"+startMinut+":"+startSecond+"Z")

                  var endHour = endDateTime.getHours() < 10 ? "0"+endDateTime.getHours(): endDateTime.getHours();
                  var endMinut = endDateTime.getMinutes() < 10 ? "0"+endDateTime.getMinutes(): endDateTime.getMinutes();
                  var endSecond = endDateTime.getSeconds() < 10 ? "0"+endDateTime.getSeconds(): endDateTime.getSeconds();
                  endDateTime = new Date(dateStr+"T"+endHour+":"+endMinut+":"+endSecond+"Z")

                  // var diffInSeconds = Math.abs(avgEndTime.getTime()-avgStartTime.getTime()) / 1000;
                  var diffInSeconds = responseData.data.avgJobTime;
                  var days = Math.floor(diffInSeconds / 60 / 60 / 24);
                  var hours = Math.floor(diffInSeconds / 60 / 60 % 24);
                  var minutes = Math.floor(diffInSeconds / 60 % 60);
                  var seconds = Math.floor(diffInSeconds % 60);

                  var onSite = hours != '00' ? hours+'h ' : ''
                  onSite += minutes != '00' ? minutes+'m ' : ''
                  onSite += seconds != '00' ? seconds+'s' : ''
                  var startTime = "--:--";
                  //New Date Time logic
                  if(responseData.data.minStartTime!='None'){
                    var startDatetimeParts = responseData.data.minStartTime.split(":");
                    
                    if(startDatetimeParts[0] > 11){
                      //PM
                      var startTime = (startDatetimeParts[0] > 12 ? (startDatetimeParts[0] - 12) : startDatetimeParts[0]) + ":" + startDatetimeParts[1] + " PM";
                    }else{
                      //AM
                      var startTime = startDatetimeParts[0] + ":"+ startDatetimeParts[1] + " AM";
                    }   
                  }
                  var endTime = "--:--";
                  if(responseData.data.maxEndTime!='None'){
                    var endDatetimeParts = responseData.data.maxEndTime.split(":");
                    if(endDatetimeParts[0] > 11){
                        //PM
                        var endTime = (endDatetimeParts[0] > 12 ? (endDatetimeParts[0] - 12) : endDatetimeParts[0]) + ":" + endDatetimeParts[1] + " PM";
                    }else{
                        //AM
                        var endTime = endDatetimeParts[0] + ":"+ endDatetimeParts[1] + " AM";
                    }
                 }
                  $scope.jobTimining = {
                    //avgStartTime: $filter('date')(startDateTime, "hh:mm a"),
                    //avgEndTime: $filter('date')(endDateTime, "hh:mm a"),
                    avgStartTime: startTime,
                    avgEndTime: endTime,
                    onSite: onSite,
                    rowCount: responseData.data.rowCount,
                    totalJobsCost: responseData.data.totalJobsCost
                  }

              } else {
                $scope.jobTimining = {
                  avgStartTime: "--:--",
                  avgEndTime: "--:--",
                  onSite: "--:--",
                  rowCount: 0,
                  totalJobsCost: 0
                }
              }
            }
            $scope.techStatsProgress = false;

        }, function(error){
              $scope.techStatsProgress = false;
        });
    }

    $scope.parseCostAvg = function(totalJobs, totalCost){
      var avgAmount = 0;
      if(totalJobs && totalCost){
          avgAmount = parseFloat(totalCost/totalJobs).toFixed(2);
      }
      return avgAmount;
    }



    $rootScope.techRating = {up:0, down: 0}
    $scope.tileSelecteCount = 0;
    parseTechRating = function(ratingObj){
        if(ratingObj && ratingObj.length > 0){
          var dataObj = {};
          dataObj[ratingObj[0]['rating'].toLowerCase()] = ratingObj[0]['count']
          if(ratingObj.length > 1){
            dataObj[ratingObj[1]['rating'].toLowerCase()] = ratingObj[1]['count']
          }
          var upRatingCount = dataObj && dataObj.up ? parseInt(dataObj.up) : 0;
          var downRatingCount = dataObj && dataObj.down ? parseInt(dataObj.down) : 0;

          var totalRatingCount = parseInt(upRatingCount) + parseInt(downRatingCount);

          var average = parseInt(upRatingCount * 100) / totalRatingCount

          var tileSelected = parseInt(average / 4);


          $scope.tileSelecteCount = parseInt(average / 4);
          $rootScope.techRating = dataObj;

        }
    }

    $scope.totalJobsCost = 0;
    $scope.jobCostData = [];

    //to get chemical cost data by technican id
    $scope.getChemicalCost = function(i) {

        
        var filterMonth = $scope.filterModel.filterMonth;
        var jobParam = {
            technicianId: $scope.technicianId,
            filterMonth: filterMonth
        };
        if ($scope.dateRangeModel.chemicalFromDate != '' && $scope.dateRangeModel.chemicalToDate != '') {
          jobParam.startDate = $filter('date')(new Date($scope.dateRangeModel.chemicalFromDate), 'yyyy-MM-dd');
          jobParam.endDate = $filter('date')(new Date($scope.dateRangeModel.chemicalToDate), 'yyyy-MM-dd');
        }
        $scope.pieChemicalCostData = [];
        var api_url = '';
        if ($scope.reportMode === 'spent') {
          api_url = "/chemicals_cost_calculation"
        } 
        if ($scope.reportMode === 'charged') {
            api_url = "/reports_price"
        }
        $scope.isChemicalGraphProcessing = true;
        apiGateWay.get(api_url, jobParam).then(function(response) {
            if (response.data) {
                if (response.data.status == 200) {
                    var jobCostResponse = response.data.data;
                    $scope.jobData = [];
                    $scope.jobCostData = [];

                    if ($scope.reportMode === 'spent') {
                      $scope.totalJobsCost = jobCostResponse.totalJobsCost;
                    } 
                    if ($scope.reportMode === 'charged') {
                      $scope.totalJobsCost = jobCostResponse.totalChemicalPrice;
                    } 
                    
                    try{
                        //$scope.totalJobsCost = $scope.totalJobsCost.toFixed(2);
                        $scope.totalJobsCost ? parseFloat($scope.totalJobsCost).toFixed(2) : '0.00';

                    }catch(error){
                    }
                    
                   
                    $scope.totalCostPerJobData = []
                    if ($scope.reportMode === 'spent') {
                      $scope.totalCostPerJobData = jobCostResponse.totalCostPerJobData;
                    } 
                    if ($scope.reportMode === 'charged') {
                      $scope.totalCostPerJobData = jobCostResponse.totalPricetPerJobData;
                    }

                    $scope.totalJobs = $scope.totalCostPerJobData.length;
                    $scope.jobCostData = [];
                    $scope.jobData = [];
                    $scope.JobIds['Series 1'] = {};


                    if ($scope.reportMode === 'spent') {
                      angular.forEach($scope.totalCostPerJobData, function(gdata) {
                        var graphDate = $filter("date")(gdata.jobCreateTime, "MM/dd/yyyy");
                        $scope.jobData.push(graphDate);
                        $scope.JobIds['Series 1'][graphDate +"-"+parseInt(gdata.totalCostPerJob)] = gdata;
                        var cost = parseFloat(gdata.totalCostPerJob);
                        $scope.jobCostData.push(cost);
                    });
                    } 
                    if ($scope.reportMode === 'charged') {
                      angular.forEach($scope.totalCostPerJobData, function(gdata) {
                        var graphDate = $filter("date")(gdata.jobCreateTime, "MM/dd/yyyy");
                        $scope.jobData.push(graphDate);
                        $scope.JobIds['Series 1'][graphDate +"-"+parseInt(gdata.totalPricePerJob)] = gdata;
                        var cost = parseFloat(gdata.totalPricePerJob);
                        $scope.jobCostData.push(cost);
                    });
                    }

                    

                    var pieChemicalCostData = [];


                    var pieCostData;

                    if ($scope.reportMode === 'spent') {
                      pieCostData = jobCostResponse.pieCostData;
                      if(pieCostData){
                        pieCostData.sort(function(a, b) {
                            return parseFloat(a.chemicalCost) - parseFloat(b.chemicalCost);
                        });
                      }
                      angular.forEach(pieCostData, function(gdata) {
                        pieChemicalCostData.push({'name': gdata['keyValue'], 'y': gdata['chemicalCost']})
                    });
                    } 
                    if ($scope.reportMode === 'charged') {
                      pieCostData = jobCostResponse.piePriceData;
                      if(pieCostData){
                        pieCostData.sort(function(a, b) {
                            return parseFloat(a.chemicalPrice) - parseFloat(b.chemicalPrice);
                        });
                      }
                      angular.forEach(pieCostData, function(gdata) {
                        pieChemicalCostData.push({'name': gdata['keyValue'], 'y': gdata['chemicalPrice']})
                    });
                    }                  
                    
                    
                    
                    
                    $scope.pieChemicalCostData = pieChemicalCostData;
                    if (!$scope.$$phase) $scope.$apply();
                    if ($scope.totalCostPerJobData) {
                      setTimeout(function(){
                          $scope.getGraph('CHEMICALCOST1', 'CHEMICAL COST');
                          $scope.getGraph('PIECHEMICALCOSTONPAGE', 'CHEMICAL COST');
                          $scope.getGraph('CHEMICALCOST2', 'CHEMICAL COST');
                          $scope.getGraph('PIECHEMICALCOST', 'CHEMICAL COST');

                      }, 1000);
                   }

                } else {
                    $scope.totalJobsCost = [];
                    $scope.totalCostPerJobData = [];
                    $scope.jobData = [];
                    $scope.jobCostData = [];
                    var analyticsData = {};
                    analyticsData.requestData = jobParam;
                    analyticsData.userData = $rootScope.userSession;
                    analyticsData.actionTime = new Date();
                    analyticsData.errorData = response.data;
                    var analyticsDataString = JSON.stringify(analyticsData);
                    var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
                    $rootScope.storeAnalytics('Error - Get Chemical Cost', "Error on getChemicalCost - " + currentDateTime, analyticsDataString, 0, true);
                }
            }
            $scope.isChemicalGraphProcessing = false;
        }, function(err) {
          $scope.isChemicalGraphProcessing = false;
        });
    };
    //to show chemical cost on dialog
    $scope.showingChemPopup = false;
    $scope.showChemicalCost = function(i, type) {
        $scope.showPie = typeof type != 'undefined' ? !type : false
        $scope.showingChemPopup = true;
        ngDialog.open({
            template: 'chemicalCost.html?ver=' + $rootScope.PB_WEB_VERSION,
            className: 'ngdialog-theme-default',
            name :'chemicalCost',
            scope: $scope,
            preCloseCallback: function() {
                $scope.showPie = false;
                $scope.showingChemPopup = false;
            }
        });
        //$scope.getChemicalCost('2');
    };

    //to show chemical cost on dialog
    $scope.showAlertTrend = function(i, type) {
        $scope.showAlertPie = typeof type != 'undefined' ? !type : true

        ngDialog.open({
            template: 'alertTrend.html?ver=' + $rootScope.PB_WEB_VERSION,
            className: 'ngdialog-theme-default',
            name :'alertTrend',
            scope: $scope,
            preCloseCallback: function() {
                $scope.showAlertPie = true;
            }
        });

    };

    $scope.getNumberToArray = function(num) {
        return new Array(num);
    };
    //for pagination case
    $scope.goToJobPage = function(page, actionButton) {
        if ((actionButton == 'first' || actionButton == 'pre') && page < 0) {
            return false;
        }
        if ((actionButton == 'last' || actionButton == 'next') && page > $scope.totalPage) {
            return false;
        }
        $scope.page = page;
        $scope.getTechnicianJobList();
    };

    //to set order of job list
    $scope.orderByJobList = function(column) {
        $scope.column = column;
        $scope.dir = ($scope.dir == 'desc') ? 'asc' : 'desc';
        $scope.getTechnicianJobList();
    };
    $scope.chartConfig = {};

    var formateNumberString = function(numValue,chartname){
        if(chartname == 'PIECHEMICALCOST' || chartname == 'PIECHEMICALCOSTONPAGE' || chartname == 'CHEMICALCOST'){
            numValue =   numValue.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,').replace('.00', '');
        }
        return numValue;
    }

    $scope.redirectToDetail = function(selectedObj){
      if(selectedObj && selectedObj.jobId && selectedObj.addressId){
        ngDialog.closeAll()
        $state.go('app.customerjobdetail', {
            jobId: selectedObj.jobId,
            addressId: selectedObj.addressId
        });
      }
    }

    // to set chart graph
    $scope.getGraph = function(chartname, charttitle) {
        var xAxisCats = $scope.jobData
        var pieData = {
            dataLabels: {
                enabled: false
            },
            showInLegend: false,
            size: '80%',
            // colors: ['#7cb5ec', '#90ed7d','#ee6e12','#285fc6','#34495e','#F3F3F3','#9e3f3f']

        }
        var type = 'area';
        var spacingTop = 10;

        if(chartname == 'PIEALERTTREND' || chartname == 'PIEALERTTRENDMODEL' || chartname == 'PIECHEMICALCOST'  || chartname == 'PIECHEMICALCOSTONPAGE'){
            type = "pie";
            spacingTop = 0;
        }
        if(chartname == 'ALERTTRENDMODEL' || chartname == 'ALERTTREND'){
            xAxisCats = $scope.dueDate;
        }
        
            $scope.chartConfig[chartname] = {};
            var isChartDivExist = document.getElementById(chartname);
            if (isChartDivExist === null || isChartDivExist === undefined || !isChartDivExist) {
              return
            }
            $scope.chartConfig[chartname] = Highcharts.chart(
              chartname,
              {

                chart: {
                  type: type,
                  spacingBottom: (chartname == 'CHEMICALCOST' || chartname == 'ALERTTRENDMODEL' || chartname == 'ALERTTREND') ? 10 : 5,
                  spacingTop: spacingTop,
                  //spacingRight:0,
                  spacingLeft: 1,
                  zoomType: "x",
                  events: {
                    load: function(event) {
                      event.target.reflow();
                    }
                  }
                },
                title: {
                  text: null
                },
                subtitle: {
                  enabled: false
                },
                legend: {
                  itemStyle: {
                    color: "#34495e",
                    fontWeight: "normal"
                  },
                  enabled: false,
                  verticalAlign: "top",
                  floating: false,
                  align: "right",
                  x: 10, // = marginLeft - default spacingLeft
                  itemWidth: 0,
                  y: 10,
                  itemDistance: 5,
                  borderWidth: 0,
                  symbolHeight: 8,
                  symbolWidth: 8,
                  symbolLineHeight: 0
                },
                plotOptions: {
                  column: {
                    pointWidth: 5
                  },
                  series: {
                    borderWidth: 0.1,
                    connectNulls: true,
                    fillOpacity: 0.3,
                    point:{
                          events:{
                                  click: function (evt) {
                                      $scope.redirectToDetail($scope.JobIds[evt.point.series.name][this.category+"-"+parseInt(this.y)]);
                                  }
                              }
                      },
                      marker: {
                        enabled: true,
                        radius: 4
                      }
                  },
                  pie: pieData,
                },
                xAxis: {
                  tickWidth: 0,
                  offset: 0,
                  categories: xAxisCats,
                  labels: {
                    enabled: false
                  }
                },
                yAxis: {
                  offset: -16,
                  title: {
                    enabled: false
                  },
                  //categories: [1,2,3,4,5,6,7,8,9,10],
                  labels: {
                    formatter: function() {
                      return this.value;
                    },
                    style: {
                      color: "#909ca9"
                    }
                  }
                },
                tooltip: {
                  useHTML: true,
                  formatter: function() {
                      if(chartname == 'PIEALERTTREND' || chartname == 'PIEALERTTRENDMODEL'){
                        return '<span>'+this.key+': <b>'+formateNumberString(this.point.y,chartname)+'</b>';
                      }else if(chartname == 'ALERTTRENDMODEL' || chartname == 'ALERTTREND'){
                        return '<span>'+this.key+'</span><br/><span style="color:'+this.point.color+'">\u25CF</span> '+this.series.name+': <b>'+formateNumberString(this.point.y,chartname)+'</b>';
                      }else{
                        var amount = this.y ? $filter("number")(this.y) : this.y;
                        return this.key + "\n</br><b>$" + amount + "</b>";
                      }
                  }
                },
                credits: {
                  enabled: false
                },
                exporting: {
                  enabled: false
                }
              }
            );

            if (chartname == 'CHEMICALCOST1' || chartname == 'CHEMICALCOST2' || chartname == 'ALERTTRENDMODEL' || chartname == 'ALERTTREND') {
                var costSeries = {
                    name: chartname == 'ALERTTRENDMODEL'  || chartname == 'ALERTTREND' ? 'Alerts' : '',
                    data: chartname == 'ALERTTRENDMODEL'  || chartname == 'ALERTTREND' ? $scope.alertCountData : $scope.jobCostData,
                    lineWidth: 1,
                    color: '#77a5e8'
                };
                $scope.chartConfig[chartname].addSeries(costSeries);
                if (chartname == 'CHEMICALCOST2' || chartname == 'PIECHEMICALCOST' || chartname == 'PIECHEMICALCOSTONPAGE') {
                    var w = '980';
                    var h = '450';
                    if (screen.width >= 768 && screen.width <= 1024) {
                        w = '630';
                        h = '350';
                    }
                    if (screen.width >= 320 && screen.width <= 736) {
                        w = '310';
                        h = '200';
                    }
                    if (screen.width >= 375 && screen.width <= 736) {
                        w = '360';
                        h = '200';
                    }
                    if (screen.width >= 1024 && screen.width <= 1280) {
                        w = '630';
                        h = '350';
                    }
                    $scope.chartConfig[chartname].setSize(w, h);
                }
            }
            if (chartname == 'PIECHEMICALCOST' || chartname == 'PIECHEMICALCOSTONPAGE'){
              var costSeries = {
                  name: 'Chemicals',
                  data: $scope.pieChemicalCostData,
                  lineWidth: 1,
                  color: '#c0e29e'
              };
              $scope.chartConfig[chartname].addSeries(costSeries);

            }
            if (chartname == 'PIEALERTTREND' || chartname == 'PIEALERTTRENDMODEL'){
              var costSeries = {
                  name: 'Alert Trend',
                  data: $scope.pieAlertTrendData,
                  lineWidth: 1,
                  color: '#c0e29e'
              };
              $scope.chartConfig[chartname].addSeries(costSeries);

            }
       
    };
    $scope.chartSize = {
        'width': '480',
        'height': '250'
    };
    if (screen.width >= 768 && screen.width <= 1024) {
        $scope.chartSize = {
            'width': '480',
            'height': '250'
        };
    }
    if (screen.width >= 320 && screen.width <= 736) {
        $scope.chartSize = {
            'width': '500',
            'height': '150'
        };
    }
    if (screen.width >= 1024 && screen.width <= 1280) {
        $scope.chartSize = {
            'width': '685',
            'height': '300'
        };
    }
    $scope.chartSizeData = [];

    $scope.jobFilterByType = function(type){
        $scope.jobFilter[type] = !$scope.jobFilter[type];
        $scope.currentPage = 1;
        $scope.getTechnicianJobList();
    }
    $scope.doSearchJobList = function($event, searchText) {
        if(searchText || $scope.searchText != searchText){
            $event.target.blur();
            $scope.currentPage = 1;
            $scope.searchText = searchText.trim().replace(/,/g, "");        
            $scope.getTechnicianJobList();
        }
    }

    $scope.filterRange = function(custom) {
      $scope.currentPage = 1;
      $scope.filterRangeSelected = custom
      if ($scope.jobRangeFilterData[$scope.filterRangeSelected].type != 'custom'){
        $scope.hideShownDatesText = true;
        $scope.hideShowDatesText = 'Hide future dates';
        $scope.showfuturedata = 1;
        $scope.getTechnicianJobList()
      }
      else {
        $scope.dateRangeModel.jobFromDate = '';
        $scope.dateRangeModel.jobToDate = '';
        $scope.hideShownDatesText = false;
        $scope.showfuturedata = 0; 
      }
    };
    $scope.downloadChemicalReport = function() {
      if (!$scope.showingChemPopup) {        
        if(!$scope.checkCustomDates($scope.filterModel.filterMonth, $scope.dateRangeModel.chemicalFromDate, 'fromTPChemDate', $scope.dateRangeModel.chemicalToDate, 'toTPChemDate')) {
          return false
        }  
      } else {
        if(!$scope.checkCustomDates($scope.filterModel.filterMonth, $scope.dateRangeModel.chemicalFromDate, 'fromTPChemDatePopUp', $scope.dateRangeModel.chemicalToDate, 'toTPChemDatePopUp')) {
          return false
        }  
      }
      var filterMonth = $scope.filterModel.filterMonth;
      var jobParam = {
          technicianId: $scope.technicianId,
          filterMonth: filterMonth
      };
      if ($scope.dateRangeModel.chemicalFromDate != '' && $scope.dateRangeModel.chemicalToDate != '') {
        jobParam.startDate = $filter('date')(new Date($scope.dateRangeModel.chemicalFromDate), 'yyyy-MM-dd');
        jobParam.endDate = $filter('date')(new Date($scope.dateRangeModel.chemicalToDate), 'yyyy-MM-dd');
      }
      let reportApiURL = '';
      if ($scope.reportMode === 'spent') {
          reportApiURL = "/download_chemical_report"
      } 
      if ($scope.reportMode === 'charged') {
          reportApiURL = "/download_chemical_price_report"
      }  
      $scope.showEmailInvoiceOpenPopup(jobParam, reportApiURL);
  };
    // email popup feature
    $scope.companyEmailforReports = auth.loggedInRole() != "administrator" ? auth.getSession().email : auth.getSession().companyEmail;   
    $scope.reportPageSelectedReportParams = {};
    $scope.reportPageIsReportSending = false;
    $scope.reportPagereportGeneratingProcessStart = false;
    $scope.reportPageSentReportEmailModel = {
        email: ''
    }
    $scope.showEmailInvoiceOpenPopup = function(jobParam, reportApiURL){
        $scope.reportPageSentReportEmailModel.email = $scope.companyEmailforReports; 
        $scope.reportPageSelectedReportParams.jobParam = jobParam;  
        $scope.reportPageSelectedReportParams.reportApiURL = reportApiURL;  
        ngDialog.open({
            template: 'sentReportEmailPopupTechProfile.html?ver=' + $rootScope.PB_WEB_VERSION,
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function() {
                $scope.reportPageSelectedReportParams = {};
                $scope.reportPageSentReportEmailModel.email = $scope.companyEmailforReports;
                $scope.reportPagereportGeneratingProcessStart = false;
                $scope.reportPageIsReportSending = false;
            }
            });
        }
    $scope.reportPageErrorMsg = '';
    $scope.sendReport = function() {
        $scope.reportPageIsReportSending = true;
        var reportURL = $scope.reportPageSelectedReportParams.reportApiURL;
        var sendReportParams = {
            email: $scope.reportPageSentReportEmailModel.email,
            reportType: ''
        }
        if (reportURL === '/download_chemical_report') {
            sendReportParams.reportType = 'chemicalCost'
        }
        if (reportURL === '/download_chemical_price_report') {
            sendReportParams.reportType = 'chemicalPrice'
        }
        if (reportURL === '/company_tech_pay_report') {
            sendReportParams.reportType = 'companyTechPay'
        }
        if (reportURL === '/tech_pay_report') {
            sendReportParams.reportType = 'techPay'
        }
        if (reportURL === '/download_tech_job_tracking_report') {
            sendReportParams.reportType = 'technicianTime'
        }
        if (reportURL === '/profit_breakdown_download') {
            sendReportParams.reportType = 'profitBreakdown'
        }
        if (reportURL === '/tech_feedback_report') {
          sendReportParams.reportType = 'feedbackReport'
        }
        apiGateWay.send('/send_email_reports', sendReportParams).then(function(response) {
            if (response.data.status == 200 && response.data.data.reportId) {
                $scope.reportPagereportGeneratingProcessStart = true;
                var params = $scope.reportPageSelectedReportParams.jobParam;
                params.reportId = response.data.data.reportId;
                $scope.generateReportByReportId(params);
                setTimeout(function(){
                    $scope.reportPagereportGeneratingProcessStart = false;
                    $scope.reportPageIsReportSending = false;                       
                    ngDialog.closeAll();
                }, 2000)
            } else {
                $scope.reportPageErrorMsg = 'Some error occured. Please try again.';
                setTimeout(function(){
                    $scope.reportPageErrorMsg = '';
                }, 2000)
            }                     
        }, function(error){
            $scope.reportPageErrorMsg = typeof error == 'string' ? error : 'Something went wrong.';
            setTimeout(function(){
                $scope.reportPageErrorMsg = '';
            }, 2000)
            $scope.reportPageIsReportSending = false;
        });
    }
    $scope.generateReportByReportId = function(params) {        
        apiGateWay.get($scope.reportPageSelectedReportParams.reportApiURL, params).then(function(response) {
        }, function(error){
        });
    }        
    $scope.checkCustomDates = function(filterMonth, startDate, startDateId, endDate, endDateId) {
      if(filterMonth == 'custom') {
          if (!startDate || startDate == '') {
              $('#' + startDateId).focus()
              return false
          }
          if (!endDate || endDate == '') {
              $('#' + endDateId).focus()
              return false
          }
      }
      return true
  }
    // email popup feature

    $scope.hideShowDates = function() {
      $scope.currentPage = 1;
      if($scope.hideShowDatesText == 'Hide future dates'){
          $scope.hideShowDatesText = 'Show future dates'; 
          $scope.showfuturedata = 0;
      }
      else{
          $scope.hideShowDatesText = 'Hide future dates';
          $scope.showfuturedata = 1;
      }
      $scope.getTechnicianJobList();
  }
  $scope.getReviewDate = (str) => {
    if (str && str.includes('T')) {      
      let _strArr = str.split('T');
      if (_strArr.length > 0) {
        let _date = _strArr[0];
        let _dateArr = _date.split('-');
        let xDate =  _dateArr[2];
        let xMonth = _dateArr[1];
        let xYear = _dateArr[0].length == 4 ? _dateArr[0].slice(-2) : _dateArr[0];
        let date =  xMonth + '/' + xDate + '/' + xYear;
        return date;    
      } else {
        return str;
      }
    }
    return str;
  }
  $scope.generateFeedbackChart = () => {
    $rootScope.hasFeedback = true;
    var isChartDivExist = document.getElementById('FEEDBACKCHART');
    if (isChartDivExist === null || isChartDivExist === undefined || !isChartDivExist) {
            return
    }
    Highcharts.chart("FEEDBACKCHART", {
      colors: ["#bc1010", "#0cad14"],
      chart: {
        plotBackgroundColor: null,
        plotBackgroundImage: null,
        plotBorderWidth: 0,
        plotShadow: false,
        height: 150,
        style: {
          fontFamily: "Lato",
        },
        type: "pie",
      },
      exporting: { enabled: false },
      credits: { enabled: false },
      title: {
        text: "<b>" + 
        Number($scope.relDiff(Number($rootScope.techRating.up),Number($rootScope.techRating.down)))
        + "%</b>",
        align: "center",
        verticalAlign: "middle",
        x: 2,
        y: 5,
      },
      tooltip: {
        headerFormat: "",
        formatter: function() {
          var percentage = this.point.percentage;
          if (percentage === Math.floor(percentage)) {
            return '<b>'+Number(percentage.toFixed(0))+'% '+this.point.name+'</b><br/><b>'+this.point.y+' total</b>';
          } else {
            return '<b>'+Number(percentage.toFixed(2))+'% '+this.point.name+'</b><br/><b>'+this.point.y+' total</b>'; 
          }
        },
        style: {
          fontSize: '11px' 
       }, 
       padding: 2,
      },
      plotOptions: {
        pie: {
          allowPointSelect: false,
          cursor: "pointer",
          dataLabels: {
            enabled: false,
            format: "{point.name}: {y} %",
          },
          showInLegend: false,
        },
      },
      series: [
        {
          name: "Technician Feedback",
          colorByPoint: true,
          innerSize: "70%",
          data: [
            {
              name: "Negative Feedback",
              y: Number($rootScope.techRating.down),
            },
            {
              name: "Positive Feedback",
              y: Number($rootScope.techRating.up),
            },
          ],
        },
      ],
    });
  };
  $scope.downloadFeedbackReport = function () {
    var jobParam = {
      techId: $scope.technicianId
    };
    let reportApiURL = '/tech_feedback_report';
    dateType = $scope.jobRangeFilterData[$scope.filterRangeSelected].type;
    if (dateType == 'custom' && $scope.dateRangeModel.jobFromDate != '' && $scope.dateRangeModel.jobToDate != '') {
      jobParam.startDate = $filter('date')(new Date($scope.dateRangeModel.jobFromDate), 'yyyy-MM-dd');
      jobParam.endDate = $filter('date')(new Date($scope.dateRangeModel.jobToDate), 'yyyy-MM-dd');
    } else {
      dateValue = $scope.jobRangeFilterData[$scope.filterRangeSelected].value
      if (dateType != 'custom') {
        jobParam.startDate = $filter('date')(new Date(moment().subtract(dateValue, dateType)), 'yyyy-MM-dd');
        jobParam.endDate = $filter('date')(new Date(moment()), 'yyyy-MM-dd');
      }
    }
    $scope.showEmailFeedbackPopup(jobParam, reportApiURL);
  };
  
  $scope.showEmailFeedbackPopup = function (jobParam, reportApiURL) {
    $scope.reportPageSentReportEmailModel.email = $scope.companyEmailforReports;
    $scope.reportPageSelectedReportParams.jobParam = jobParam;
    $scope.reportPageSelectedReportParams.reportApiURL = reportApiURL;
    ngDialog.open({
      template: 'sentReportEmailPopupFeedback.html?ver=' + $rootScope.PB_WEB_VERSION,
      className: 'ngdialog-theme-default v-center',
      overlay: true,
      closeByNavigation: true,
      scope: $scope,
      preCloseCallback: function () {
        $scope.reportPageSelectedReportParams = {};
        $scope.reportPageSentReportEmailModel.email = $scope.companyEmailforReports;
        $scope.reportPagereportGeneratingProcessStart = false;
        $scope.reportPageIsReportSending = false;
      }
    });
  }
  $scope.relDiff = (a, b) => {
    return (Math.abs((a * 100) / (a + b))).toFixed(2);
  }
  $scope.getToolPercentage = (value) => {
    return Number(value);
  }
  // edit truck
  $scope.isTruckProcessing = false;
  $scope.getTruckById = function (id) {
    $scope.isTruckProcessing = true;
    apiGateWay.get('/inventory/trucks', { truckId: id }).then(function (response) {
      if (response.data.status == 200) {
        $scope.model = response.data.data;
        // check if duplicate cover image exists then set first image as cover image and remove duplicate cover image
        if ($scope.model.images && $scope.model.images.length > 0) {
          $scope.model.images = $rootScope.normalizeCoverPhotos($scope.model.images);
        }
      }
      $scope.isTruckProcessing = false;
    }, function (error) {
      $scope.errorMessage = error;
      $scope.showError();
      $scope.isTruckProcessing = false;
    });
  }
  $scope.model = null;
  $scope.addVehiclePopup = null;
  $scope.openEditTruck = function (id) {
    if (id) {
      $scope.getTruckById(id);
    }
    $scope.formSubmitted = false;
    $scope.addVehiclePopup = ngDialog.open({
      template: 'templates/trucktools/updateVehiclePopup.html?ver=' + $rootScope.PB_WEB_VERSION,
      className: 'ngdialog-theme-default v-center',
      scope: $scope,
      closeByDocument: true,  // Allow closing on outside click
      trapFocus: false,
      preCloseCallback: function () {
        let temp = angular.copy($scope.model);
        $scope.deleteTechS3Images(temp);
        $scope.model = null;
        $scope.isTruckProcessing = false;
        $scope.truckImageProcessing = {};
        $scope.getTechnicianInfo();
      }
    })
  };
  // switch vehicle
  $scope.vehicleList = [];
  $scope.vehicleSearchKey = null;
  $scope.vehiclePopup = null;
  $scope.openVehicleSwitchPopup = function (vehicle) {
    $scope.model = vehicle;
    $scope.getVehicleList();
    $scope.vehiclePopup = ngDialog.open({
      id: 11,
      template: 'templates/trucktools/switchVehiclePopup.html?ver=' + $rootScope.PB_WEB_VERSION,
      className: "ngdialog-theme-default v-center",
      scope: $scope,
      closeByDocument: true,  // Allow closing on outside click
      trapFocus: false,
      preCloseCallback: function () {
        $scope.vehicleSearchKey = "";
        $scope.isProcessing = false;
        $scope.model = null;
        $scope.vehicleSearchText = $scope.vehicleSearchBox.searchText = null;
      },
    });
  }
  $scope.getVehicleList = function () {
    $scope.vehicleList = [];
    var paramObj = { status: 'Active', offset: 0, limit: 30, searchKey: $scope.vehicleSearchKey };
    if ($scope.vehicleSearchText) {
      paramObj.searchText = $scope.vehicleSearchText;
    }
    apiGateWay.get("/inventory/truck_list", paramObj).then(function (response) {
      if (response.data.status == 200) {
       let rowTruck = response.data.data.truckList;
        if ($scope.technicianinfo.assignedTruckDetails && $scope.technicianinfo.assignedTruckDetails.id) {
          $scope.vehicleList = $rootScope.sortItemToTop(rowTruck, $scope.technicianinfo.assignedTruckDetails.id);
        } else {
          $scope.vehicleList = rowTruck;
        }
      } else {
        $scope.vehicleList = [];
      }
    }, function (error) {
      // handle error
    })
  };
  
  var tempFilterText = '', filterTextTimeout;
  $scope.searchVehicle = function (searchText) {
    if (filterTextTimeout) $timeout.cancel(filterTextTimeout);
    if (searchText == $scope.vehicleSearchKey || (searchText == $scope.vehicleSearchKey && !searchText)) {
      return false;
    }
    if (filterTextTimeout) $timeout.cancel(filterTextTimeout);

    tempFilterText = searchText;
    filterTextTimeout = $timeout(function () {
      $scope.vehicleSearchText = tempFilterText;
      $scope.getVehicleList();
    }, 500); // delay 250 ms
  }
  $scope.assignVehicle = function (id, index = 0) {
    if (id == 0) {
      $scope.assignTruck(0);
    } else {
      let truck = $scope.vehicleList.find(function (truck) {
        return truck.id == id;
      });
      if (!truck) {
        $scope.vehiclePopup.close();
        return;
      }
      $scope.assignTruck(truck.id);
    }
  }
  $scope.assignTruck = function(id) {
    $scope.vehiclePopup.close();
    var paramObj = {techId: Number($scope.technicianId), truckId: id, "actionPerformed": 'truck-assigned' };
    apiGateWay.send("/inventory/technician_truck", paramObj).then(function(response) {
        if (response.data.status == 200) {
          if ($scope.vehicleList.length > 0) {
            let truck = $scope.vehicleList.find(function (truck) {
              return truck.id == id;
            });
            $scope.technicianinfo.assignedTruckDetails = truck ? truck : null
          }
        }
    }, function(error){
        // handle error
        $scope.errorMessage = error;
        $scope.showError();
    })
  };
  $scope.showError = function () {
    $timeout(function () {
      $scope.successMessage = '';
      $scope.errorMessage = '';
    }, 3000);
  }
  // truck image uploading
  $scope.techPageInputChange = function (e) {
    const maxImages = 8;
    const maxSize = 2 * 1024 * 1024; // 2MB
    const allowedExtensions = ['png', 'jpg', 'jpeg'];

    if (!$scope.model.images) {
        $scope.model.images = [];
    }

    if ($scope.model.images.length >= maxImages) {
        $scope.errorMessage = "Only 8 images are allowed";
        $timeout($scope.showError, 0); // delay to allow rendering
        e.target.value = null;
        return;
    }

    const file = e.target.files && e.target.files[0];

    if (!file) {
        $scope.errorMessage = "No file selected.";
        $timeout($scope.showError, 0);
        e.target.value = null;
        return;
    }

    if (file.size > maxSize) {
        $scope.errorMessage = "Maximum 2MB file size upload is allowed";
        $timeout($scope.showError, 0);
        e.target.value = null;
        return;
    }

    const extension = file.name.split('.').pop().toLowerCase();

    if (!allowedExtensions.includes(extension)) {
        $scope.errorMessage = "Please select image format in JPEG, PNG or JPG.";
        $timeout($scope.showError, 0);
        e.target.value = null;
        return;
    }

    const imageIndex = $scope.model.images.length;
    if (!$scope.truckImageProcessing) {
        $scope.truckImageProcessing = [];
    }
    $scope.truckImageProcessing[imageIndex] = true;

    const baseId = $scope.model.id || ($scope.technicianinfo?.assignedTruckDetails?.id);
    const uploadedFileName = `${baseId}/${$rootScope.getFileNameForUpload(file.name)}.${extension}`;
    const key = $scope.truckImageAwsPath + uploadedFileName;

    AwsS3Utility.upload(key, file)
        .then(function () {
            const imageObj = {
                fileName: key,
                status: 1,
                isCoverPhoto: $scope.model.images.length === 0 ? 1 : 0,
                mediaPath: $scope.awsCDNpath + key
            };

            $scope.model.images.push(imageObj);
            $scope.blurTechSaveForm('images');
        })
        .catch(function () {
            $scope.errorMessage = "AWS not loaded properly. Please try again";
            $timeout($scope.showError, 0);
            $scope.initConfig();
        })
        .finally(function () {
            $scope.truckImageProcessing[imageIndex] = false;
            e.target.value = null;
        });
  };
  // set selected image as cover and un-set other cover image
  $scope.setVehicleCover = function(photos, coverImg) {
    if (!photos || photos.length == 0) {
        return;
    }
    if ($scope.model.images && $scope.model.images.length > 0) {
        angular.forEach($scope.model.images, function(image) {
            if (image.mediaPath == coverImg.mediaPath) {
                image.isCoverPhoto = 1;
            } else {
                image.isCoverPhoto = 0;
            }
        });
        $scope.blurTechSaveForm('cover-image-change');
    }
  }
  // delete image from vehicle
  $scope.deleteVehicleImage = function (image) {
    if ($scope.model.images && $scope.model.images.length > 0) {
      let imgIndex = $scope.model.images.indexOf(image);
      if (imgIndex != -1) {
        $scope.model.images[imgIndex].status = 0;
        // if deleted image is cover image, set new photo as cover image
        if ($scope.model.images[imgIndex].isCoverPhoto) {
          $scope.model.images[imgIndex].isCoverPhoto = 0;
          if ($scope.model.images.length > 0) {
            let isCoverSet = false;
            angular.forEach($scope.model.images, function (image) {
              if (!isCoverSet && image.status != 0) {
                isCoverSet = true;
                image.isCoverPhoto = 1;
              }
            })
          }
        }
        $scope.blurTechSaveForm('image-deleted');
        // delete image from S3
        let temp = angular.copy($scope.model);
        $scope.deleteTechS3Images(temp);
        $scope.model.images.splice(imgIndex, 1);
      }
    }
  }
  // delete S3 image
  $scope.deleteTechS3Images = function (item) {
    let itemsForDelete = []
    if (item && item.images && item.images.length > 0) {
      angular.forEach(item.images, function (image) {
        if (image.status == 0) {
          let deleteFileName = $rootScope.extractFileNameFromURL(image.mediaPath);
          deleteFileName = $scope.truckImageAwsPath + deleteFileName;
          itemsForDelete.push(deleteFileName);
        }
      })
    }
    if (itemsForDelete && itemsForDelete.length > 0) {
      AwsS3Utility.deleteFiles(itemsForDelete)
        .then(function (data) {
          // delete
        })
        .catch(function (error) {
          // if error then retry
          $scope.initAws();
        })
    }
  }
  // update vehicle
  $scope.isTruckProcessing = false;
  $scope.updateVehicle = function () {
    let apiParams = angular.copy($scope.model);
    let payload = {
      "truckId": apiParams.id,
      "name": apiParams.name,
      "year": apiParams.year,
      "make": apiParams.make,
      "model": apiParams.model,
      "color": apiParams.color,
      "vin": apiParams.vin,
      "licensePlate": apiParams.licensePlate,
      "notes": apiParams.notes,
      "images": apiParams.images || [],
      "assignedTechId": apiParams.assignedTechId && apiParams.assignedTechId != null ? apiParams.assignedTechId : 0,
      "actionPerformed": $rootScope.actionPerformed
    };
    $scope.isTruckProcessing = false;
    apiGateWay.put('/inventory/trucks', payload).then(function (response) {
      if (response.data.status == 200) {
        $scope.isTruckProcessing = false;
        $scope.successMessage = response.data.message;
        $scope.showError();
      }
      // update open vehicle details in model
      if ($scope.model && $scope.model.id) {
        $scope.getTruckById($scope.model.id);
      }
    }, function (error) {
      $scope.errorMessage = error;
      $scope.showError();
      $scope.isTruckProcessing = false;
    });
  }
  
  // technician mangagement
  $scope.techSearchKey = null;
  $scope.technicianList = [];
  $scope.technicianPopup = null;
  $scope.techId = 0;
  $scope.openTechnicianPopup = function () {
    if ($scope.model.assignedTechId && $scope.model.assignedTechId != 0) {
      $scope.techId = $scope.model.assignedTechId;
    }
    $scope.getPopupTechnicianList();
    $scope.technicianPopup = ngDialog.open({
      id: 11,
      template: 'templates/component/assignTechnician.html?ver=' + $rootScope.PB_WEB_VERSION,
      className: "ngdialog-theme-default v-center",
      overlay: true,
      closeByNavigation: false,
      scope: $scope,
      preCloseCallback: function () {
        $scope.techSearchText = "";
        $scope.techSearchKey = "";
        $scope.isProcessing = false;
        $scope.techId = 0;
      },
    });
  }

  $scope.getPopupTechnicianList = function () {
    $scope.technicianList = [];
    var paramObj = { status: 'Active', offset: 0, limit: 30, searchKey: $scope.techSearchKey };
    apiGateWay.get("/technicians", paramObj).then(function (response) {
      if (response.data.status == 200) {
        var technicianListResponse = response.data.data;
        $scope.technicianList = technicianListResponse.data;
      } else {
        $scope.technicianList = [];
      }
    }, function (error) {
      // handle error
    })
  };

  var tempTechFilterText = '', filterTechTextTimeout;
  $scope.searchTech = function (searchText) {
    if (filterTechTextTimeout) $timeout.cancel(filterTechTextTimeout);
    if (searchText == $scope.techSearchKey || (searchText == $scope.techSearchKey && !searchText)) {
      return false;
    }
    if (filterTechTextTimeout) $timeout.cancel(filterTechTextTimeout);

    tempTechFilterText = searchText;
    filterTechTextTimeout = $timeout(function () {
      $scope.techSearchKey = tempTechFilterText;
      $scope.getPopupTechnicianList();
    }, 500); // delay 250 ms
  }

  $scope.assignTechnician = function (id, index) {
    if (id == 0) {
      $scope.model.assignedTechId = null;
      $scope.model.assignedTechName = '';
      $scope.model.assignedTechImage = ''
      $scope.technicianinfo.assignedTruckDetails = null;
      $scope.technicianPopup.close();
    } else {
      let tech = $scope.technicianList.find(function (tech) { return tech.id == id });
      if (!tech) {
        return;
      }
      $scope.model.assignedTechId = tech.id;
      $scope.model.assignedTechImage = tech.userImage;
      let lastName = tech.lastName ? tech.lastName.charAt(0).toUpperCase() + '.' : '';
      $scope.model.assignedTechName = tech.firstName + ' ' + lastName;
    }
    // finally handle the assign
    $scope.blurTechSaveForm('technician');
    if ($scope.technicianPopup) {
      $scope.technicianPopup.close();
    }
    if ($scope.addVehiclePopup) {
      $scope.addVehiclePopup.close();
    }
  }
  
  // auto save on blur event of form in edit mode
  $scope.blurTechSaveForm = function (nodeName) {
    $rootScope.actionPerformed = nodeName;
    // submit the hidden button programmatically
    $scope.formSubmitted = true;
    if ($scope.model.name && $scope.model.name.trim() != '') {
      $scope.updateVehicle();
    }
  }
  
  $scope.unAssignTechFromVehicle = function (techId) {
    if (techId) {
      let payload = { techId: Number(techId), truckId: 0, "actionPerformed": 'truck-unassigned'};
      apiGateWay.send('/inventory/technician_truck', payload).then(function (response) {
        if (response.data.status == 200) {
          $scope.successMessage = response.data.message;
          $scope.showError();
          $scope.getVehicleList();
        }
      }, function (error) {
        $scope.errorMessage = error;
        $scope.showError();
      });
    } else {
      $scope.errorMessage = 'Invalid technician or vehicle';
      $scope.showError();
    }
  }
  
});
