angular.module('POOLAGENCY').controller('oneTimeJobListController', function($scope,$state, deviceDetector, $timeout, $rootScope, $filter, $sce, apiGateWay, service, $stateParams, ngDialog,Analytics, configConstant, auth){
    $scope.addressId = $stateParams.addressId;
    $scope.selectDate = '';
    $scope.currentPage = 1;
    $scope.limit = 10;
    $scope.dir = 'desc';
    $scope.column = 'createTime';
    $scope.isProcessing = false;
    $scope.statusName = "All";
    $scope.statusId = "";
    $scope.statusComplete = false;
    $scope.jobStatusClass = "All";
    $scope.jobStatusIcon = '';
    $scope.jobStatusId = "";
    $scope.jobStatusList = '';
    $scope.filterReportDataJob = ['1 week','1 month','90 days', '6 months', '1 year', 'custom'];
    $scope.hideShowDatesText = $rootScope._hideShowDatesText ? $rootScope._hideShowDatesText : 'Hide future dates';
    $scope.hideShownDatesText = $rootScope._hideShownDatesText === false ? false : true;
    $scope.showfuturedata = $rootScope._showfuturedata === 0 ? 0 : 1;

    if ($scope.jobStatus && $scope.jobStatus != ''){
        $scope.jobStatus = $scope.jobStatus;
    } else if ($rootScope.jobStatus && $rootScope.jobStatus != ''){
        $scope.jobStatus = $rootScope.jobStatus;
    } else {
        $scope.jobStatus = 'All';
    }

    if ($scope.filterDuration && $scope.filterDuration != ''){
        $scope.filterDuration = $scope.filterDuration;
    } else if ($rootScope.filterDuration && $rootScope.filterDuration != ''){
        $scope.filterDuration = $rootScope.filterDuration;
    } else {
        $scope.filterDuration = '1 month';
    }

    if ($scope.jobStatusTitle && $scope.jobStatusTitle != ''){
        $scope.jobStatusTitle = $scope.jobStatusTitle;
    } else if ($rootScope.jobStatusTitle && $rootScope.jobStatusTitle != ''){
        $scope.jobStatusTitle = $rootScope.jobStatusTitle;
    } else {
        $scope.jobStatusTitle = 'All';
    }

    if ($scope.fromDate && $scope.fromDate != ''){
        $scope.fromDate = $scope.fromDate;
    } else if ($rootScope.fromDateJob && $rootScope.fromDateJob != ''){
        $scope.fromDate = $rootScope.fromDateJob;
    } else {
        $scope.fromDate = '';
    }

    if ($scope.toDate && $scope.toDate != ''){
        $scope.toDate = $scope.toDate;
    } else if ($rootScope.toDateJob && $rootScope.toDateJob != ''){
        $scope.toDate = $rootScope.toDateJob;
    } else {
        $scope.toDate = '';
    }
    $scope.exportJobReportParams = {};
    $scope.exportJobReportEmailModel = {
        email: ''
    }
    $scope.searchJobTextKey = '';
    $scope.getJobStatusName = (status) => {
        let statusName = '';
        status = Number(status);
        if (status === 1) { statusName = "Not Started" }
        if (status === 2) { statusName = "No Access" }
        if (status === 3) { statusName = "In Progress" }
        if (status === 4) { statusName = "Completed" }
        if (status === 5) { statusName = "Closed" }
        return statusName;
    }
    $scope.filterByDuration = function(filterDuration){
        $scope.currentPage = 1;
        $scope.fromDate = "";
        $scope.toDate = "";
        $scope.filterDuration = filterDuration;
        if($scope.filterDuration!='custom'){
            $scope.isProcessing = true;
            $scope.hideShownDatesText = true;
            $scope.hideShowDatesText = 'Hide future dates';
            $scope.showfuturedata = 1;
            $scope.getCustomerJobList();
        } else {
            $scope.hideShownDatesText = false;
            $scope.showfuturedata = 0;
            $timeout(function() {
                angular.element(document.getElementById('fromDateInput')).focus();
            });   
        }
    }

    $scope.getCustomerJobList = function() {
        $scope.setParamFilters();
        var isCustomDateValid = true;
        if($scope.filterDuration == 'custom'){
            if ($scope.fromDate == '') {                    
                isCustomDateValid = false;
                $timeout(function() {
                    angular.element(document.getElementById('fromDateInput')).focus();
                }); 
            } else if ($scope.toDate == '') {
                isCustomDateValid = false;
                $timeout(function() {
                    angular.element(document.getElementById('toDateInput')).focus();                    
                });   
            }            
        }
        if (!isCustomDateValid && $scope.filterDuration == 'custom') {
            return 
        } 
        $scope.isProcessing = true;
        var jobParam = {
            page: $scope.currentPage - 1,
            length: $scope.limit,
            dir: $scope.dir,
            column: $scope.column,
            jobStatus: $scope.jobStatus,
            duration: $scope.filterDuration,
            showfuturedata: $scope.showfuturedata,
            searchText: $scope.searchJobText
        };
        $scope.page = $scope.currentPage

        if ($scope.fromDate != '' && $scope.toDate != '') {
            jobParam.startDate = $filter('date')(new Date($scope.fromDate), 'yyyy-MM-dd');
            jobParam.endDate = $filter('date')(new Date($scope.toDate), 'yyyy-MM-dd');
        }

        if (jobParam.jobStatus == 0 || jobParam.jobStatus == '0') {
            jobParam.jobStatus = 'All'
        }
        $scope.exportJobReportParams = jobParam;
        apiGateWay.get("/one_job_list", jobParam).then(function(response) {
            if (response.data.status == 200) {
                var jobListResponse = response.data.data;
                $scope.totalRecord = jobListResponse.rows;
                $scope.totalPage = ($scope.totalRecord % $scope.limit) !== 0 ? parseInt($scope.totalRecord / $scope.limit) : parseInt(($scope.totalRecord / $scope.limit)) - 1;
                $scope.jobList = jobListResponse.data;
                jobStatusList = jobListResponse.jobStatus;
                jobStatusList.unshift({ id: 'All', statusName: 'All' })
                $scope.jobStatusList = jobStatusList;
                $scope.jobStatusId = $scope.jobStatus;
                angular.forEach(jobStatusList, (element, index) => {
                    if($scope.jobStatus == element.id){
                        $scope.statusName = element.statusName;  
                        $scope.statusId =  element.id; 
                        if($scope.statusId == 4){
                            $scope.statusComplete = true;
                        }
                    }
                });

            } else {
                $scope.jobList = [];
            }
            $scope.isProcessing = false;
        },function(error){
        });
    };

    $scope.selectJobStatus = (statusName) => {
        $scope.statusName = statusName.statusName;
        $scope.statusId = statusName.id;
        if($scope.statusName == "All"){
            $scope.jobStatusClass = "all";
            $scope.jobStatusIcon = "jobstatus-icon0";
            $scope.jobStatusTitle = 'all';
        } 
        if($scope.statusName == "Not Started"){
            $scope.jobStatusClass = "not-started";
            $scope.jobStatusIcon = "jobstatus-icon1";
            $scope.jobStatusTitle = 'Not Started';
        } 
        if($scope.statusName == "No Access"){
            $scope.jobStatusClass = "no-access";
            $scope.jobStatusIcon = "jobstatus-icon2";
            $scope.jobStatusTitle = 'No Access';
        } 
        if($scope.statusName == "In Progress"){
            $scope.jobStatusClass = "in-progress";
            $scope.jobStatusIcon = "jobstatus-icon3";
            $scope.jobStatusTitle = 'In Progress';
        } 
        if($scope.statusName == "Completed"){
            $scope.jobStatusClass = "completed";
            $scope.jobStatusIcon = "jobstatus-icon4";
            $scope.jobStatusTitle = 'Completed';
        } 
        if($scope.statusName == "Closed"){
            $scope.jobStatusClass = "Closed";
            $scope.jobStatusIcon = "jobstatus-icon5";
            $scope.jobStatusTitle = 'Closed';
        }
        $scope.currentPage = 1;
        $scope.limit = 10;
        $scope.dir = 'desc';
        $scope.column = 'createTime';
        $scope.jobStatus = $scope.statusId;
        $scope.getCustomerJobList();                    
    }

    $(document).ready(function() {
        $('.input-daterange').datepicker({
            autoclose: true,
            // endDate: moment().format('MM-YYYY'),
            todayBtn: "linked"
        });
    });

    $scope.clickDate = function(event) {
        angular.element(document.getElementsByClassName('currentDateCalendar')).removeClass('currentDateCalendar');
        angular.element(event.target.parentNode).addClass('currentDateCalendar');
    }

    $scope.filterByDate = function(p) {
        if ($scope.fromDate != '' && $scope.toDate != '') {
            var fromDate = new Date($scope.fromDate)
            var toDate = new Date($scope.toDate);
            if (fromDate <= toDate) {
                $scope.filterDuration = "custom";
                $scope.currentPage = 1;
                $scope.limit = 10;
                $scope.dir = 'desc';
                $scope.column = 'createTime';
                $scope.getCustomerJobList();
            } else {
                if (p == 'fromDate') {
                    $scope.fromDate = '';
                } else {
                    $scope.toDate = '';
                }
            }
        } else {
            if ($scope.fromDate == '' && $scope.toDate == '') {
                $scope.getCustomerJobList();
            }
        }
    };

    $scope.orderByJobList = function(column) {
        $scope.column = column;
        $scope.dir = ($scope.dir == 'desc') ? 'asc' : 'desc';
        $scope.getCustomerJobList();
    };

    $scope.goToDetail = function(job,isOneOfJob) {
        if (event.ctrlKey || event.metaKey){
            var url = "/app/one-time-job/"+job.addressId+'/'+job.jobId;
            window.open(url,'_blank');
        }else{
            $state.go("app.onetimejob",{"addressId":job.addressId,"jobId":job.jobId}, {reload: true});
        }  
    };

    $scope.goToCustomerJobListPage = function(page) {
        $scope.currentPage = page;
        $scope.getCustomerJobList();
    };

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
        $scope.getCustomerJobList();
    }
    $scope.companyEmailforReports = auth.loggedInRole() != "administrator" ? auth.getSession().email : auth.getSession().companyEmail;    
    $scope.showEmailJobReportOpenPopup = function(){
        var isCustomDateValid = true;
        if($scope.filterDuration == 'custom'){
            if ($scope.fromDate == '') {                    
                isCustomDateValid = false;
                $timeout(function() {
                    angular.element(document.getElementById('fromDateInput')).focus();
                }); 
            } else if ($scope.toDate == '') {
                isCustomDateValid = false;
                $timeout(function() {
                    angular.element(document.getElementById('toDateInput')).focus();                    
                });   
            }            
        }
        if (!isCustomDateValid && $scope.filterDuration == 'custom') {
            return 
        } 
        $scope.exportJobReportEmailModel.email = $scope.companyEmailforReports; 
        $scope.showEmailJobReportOpenPopupModal = ngDialog.open({
            template: 'sentJobReportEmailPopup.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function() {
                $scope.exportJobReportStyleType = '';
                $scope.exportJobReportEmailModel.email = $scope.companyEmailforReports;                
            }
            });
    }
    $scope.reportPageErrorMsg = '';
    $scope.sendJobReport = function() {
        $scope.exportJobReportisSending = true;
        var sendReportParams = {
            email: $scope.exportJobReportEmailModel.email,
            reportType: 'jobReport',
        }
        apiGateWay.send('/send_email_reports', sendReportParams).then(function(response) {
            if (response.data.status == 200 && response.data.data.reportId) {
                $scope.exportJobReportGenerateProcessStart = true;
                var params = $scope.exportJobReportParams;
                params.reportId = response.data.data.reportId;
                $scope.generateReportByReportId(params);
                setTimeout(function(){
                    $scope.exportJobReportGenerateProcessStart = false;
                    $scope.exportJobReportisSending = false;                       
                    $scope.showEmailJobReportOpenPopupModal.close();
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
            $scope.exportJobReportisSending = false;
        });
    }
    $scope.generateReportByReportId = function(params) {       
        delete params.length     
        delete params.page     
        var apiURL = '/one_off_job_report_excel';
        apiGateWay.get(apiURL, params).then(function(response) {
            // Report sent
        }, function(error){
        });
    }
    $scope.doSearchJobList = function($event,searchJobTextKey) {
        if(searchJobTextKey || $scope.searchJobText != searchJobTextKey){
            $event.target.blur();
            $scope.currentPage = 1;            
            $scope.searchJobText = searchJobTextKey.trim().replace(/,/g, "");        
            $scope.getCustomerJobList();
        }
    };
    $scope.setParamFilters = function() {
        $rootScope.jobStatus = $scope.jobStatus;
        $rootScope.jobStatusTitle = $scope.jobStatusTitle;
        $rootScope.filterDuration = $scope.filterDuration;
        $rootScope.fromDateJob = $scope.fromDate;
        $rootScope.toDateJob = $scope.toDate;        
        $rootScope._showfuturedata = $scope.showfuturedata;
        $rootScope._hideShowDatesText = $scope.hideShowDatesText;
        $rootScope._hideShownDatesText = $scope.hideShownDatesText;
    }
});