angular.module('POOLAGENCY').controller('emailHistoryController', function($rootScope, $scope, $timeout, apiGateWay, ngDialog, auth, getFroalaConfig, pendingRequests, configConstant) {
    // Send history        
    $scope.emailHistoryRangeFilterData = [
        { title: '1 WEEK', value: '1 week' },
        { title: '1 MONTH', value: '1 month' },
        { title: '90 DAYS', value: '90 days' },
        { title: '6 MONTHS', value: '6 months' },
        { title: '1 YEAR', value: '1 year' },
        { title: 'CUSTOM', value: 'custom' },
    ];    
    $scope.emailHistoryFilterRange = function(filter) {
        $scope.emailHistoryListOffset = 0;
        $scope.emailHistorySelectedFilterRange = filter;        
        if (filter.value==='custom') {
            $scope.emailHistoryFromDate = null;   
            $scope.emailHistoryToDate = null;  
            $(document).find('#emailHistoryFromDate').val('')
            $(document).find('#emailHistoryToDate').val('')
            setTimeout(function(){
                $scope.initEmailHistoryDatePickers();
                $(document).find('#emailHistoryFromDate').focus();                
            },100)
        } else {
            $scope.getEmailHistory();
        }
    }
    $scope.initEmailHistoryDatePickers = function() {
        $(document).ready(function() {
            $('.input-daterange').datepicker({
                autoclose: true,
                endDate: moment().format('MM-YYYY'),
                todayBtn: "linked"
            });
        });
    }
    $scope.emailHistoryListData = null;
    $scope.emailHistoryListTotalEmail = null;
    $scope.emailHistoryListPage = null;
    $scope.emailHistoryListColumnName = null;
    $scope.emailHistoryListLength = null;
    $scope.emailHistoryListDir = null;
    $scope.emailHistoryListOffset = null;
    $scope.emailHistoryListTotalPage = null;
    $scope.isEmailHistoryListLoading = true;
    $scope.selectedEmailHistoryFilterType = null;  
    $scope.emailHistoryDatePickerOption = {format: 'MM/DD/YYYY', showClear: false};   
    $scope.emailHistoryFromDate = null;   
    $scope.emailHistoryToDate = null;       
    $scope.emailHistoryFilterTypes = [
        { id: "", label: "All" },
        { id: "groupEmail", label: "Group Email" },
        { id: "invoiceEmail", label: "Invoice Email" },
        { id: "routeStopEmail", label: "Route Stop Email" },
        { id: "jobEmail", label: "Job Email" },
        { id: "quoteEmail", label: "Quote Email" },
        { id: "previewEmail", label: "Preview Email"},     
        { id: "invoiceReminder", label: "Invoice Reminder" },
        { id: "quoteReminder", label: "Quote Reminder" },
        { id: "routeDayChange", label: "Route Day Change" },
    ];
    $scope.initPayloadForEmailHistory = function() {        
        $scope.emailHistoryListData = [];
        $scope.emailHistoryListTotalEmail = 0;
        $scope.emailHistoryListPage = 1;
        $scope.emailHistoryListColumnName = 'dateTime';
        $scope.emailHistoryListLength = 50;
        $scope.emailHistoryListDir = 'desc';
        $scope.emailHistoryListOffset = 0;
        $scope.emailHistoryListTotalPage = 0;
        $scope.selectedEmailHistoryFilterType = $scope.emailHistoryFilterTypes[0]; 
        $scope.emailHistorySelectedFilterRange = $scope.emailHistoryRangeFilterData[0];        
        $scope.getEmailHistory();
    };        
    $scope.filterEmailHistoryByDate = function(p) {
        let emailHistoryFromDateVal = $(document).find('#emailHistoryFromDate').val();
        let emailHistoryToDateVal = $(document).find('#emailHistoryToDate').val();
        if (emailHistoryFromDateVal != '' && emailHistoryToDateVal != '') {
            $scope.emailHistoryListPage = 1;
            $scope.emailHistoryListOffset = 0;
            $scope.emailHistoryListTotalPage = 0;
            $scope.emailHistoryFromDateVal = emailHistoryFromDateVal;
            $scope.emailHistoryToDateVal = emailHistoryToDateVal;
            $scope.getEmailHistory();
        }
    }
    $scope.searchEmailHistoryKey = ''; 
    $scope.emailHistoryFilterSortingData = [
        { id:'dateTime', value: 'Date' },
        { id:'displayName', value: 'Customer' },
        { id:'type', value: 'Type' },
        { id:'templateName', value: 'Template' },
        { id:'sentBy', value: 'Sent By' },
        { id:'email', value: 'Email' },
        { id:'status', value: 'Status' },
    ]  
    $scope.selectedEmailHistoryFilterSortingTitle = 'SORT BY';   
    $scope.getEmailHistoryRowStatusName = function(status) {
        let label = '';
        if (status == 0) {
            label = 'Failed';
        }
        if (status == 1) {
            label = 'Success';
        }
        if (status == 3) {
            label = 'Blocked';
        }
        return label;
    }
    $scope.getEmailHistory = function() {      
        $scope.isEmailHistoryListLoading = true;
        let emailHistoryPayload = {
            column: $scope.emailHistoryListColumnName,
            dir: $scope.emailHistoryListDir,
            length: $scope.emailHistoryListLength,
            page: $scope.emailHistoryListOffset,
            searchKey: $scope.searchEmailHistoryKey,
            type: $scope.selectedEmailHistoryFilterType ? $scope.selectedEmailHistoryFilterType.id : '',
            filterDuration: $scope.emailHistorySelectedFilterRange.value
        }    
        if (emailHistoryPayload.filterDuration === 'custom') {
            emailHistoryPayload.fromDate = moment($scope.emailHistoryFromDateVal).format('YYYY-MM-DD');
            emailHistoryPayload.toDate = moment($scope.emailHistoryToDateVal).format('YYYY-MM-DD');
        } else {
            if (emailHistoryPayload.fromDate) delete emailHistoryPayload.fromDate
            if (emailHistoryPayload.toDate) delete emailHistoryPayload.toDate
        }
        $scope.emailHistoryListPage =  $scope.emailHistoryListOffset + 1
        let endpoint = '/get_email_history_data';
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
        apiGateWay.get(endpoint, emailHistoryPayload).then(function(response) {
            if (response.data.status == 200) {                    
                let responseData = response.data.data.data;
                $scope.emailHistoryListData = [];                
                if (responseData && responseData.length > 0) {
                    responseData.forEach(function(row){                        
                        let emailRow = {
                            date: moment(row.dateTime).format('MM/DD/YY'),
                            time: moment(row.dateTime).format('hh:mm A'),
                            displayName: row.displayName,
                            type: row.type,
                            templateName: row.templateName, 
                            sentBy: row.sentBy,
                            email: row.email,
                            status: row.status
                        }
                        $scope.emailHistoryListData.push(emailRow)
                    });
                    document.getElementById('emailHistoryTbody').scrollTop = 0;
                }
                if (emailHistoryPayload.page == 0) {
                    $scope.emailHistoryListTotalEmail = response.data.data.count;
                }
                $scope.emailHistoryListTotalPage = ($scope.emailHistoryListTotalEmail % $scope.emailHistoryListLength) !== 0 ? Math.ceil($scope.emailHistoryListTotalEmail / $scope.emailHistoryListLength) : Math.ceil(($scope.emailHistoryListTotalEmail / $scope.emailHistoryListLength)) - 1;
            } else {
                $scope.emailHistoryListData = [];
                $scope.emailHistoryListTotalEmail = 0;
                $scope.emailHistoryListTotalPage = 0;
            }
            $scope.isEmailHistoryListLoading = false;
        }, function(error) {
            $scope.isEmailHistoryListLoading = false;
            $scope.emailHistoryListData = [];
            $scope.emailHistoryListTotalEmail = 0;
            $scope.emailHistoryListTotalPage = 0;
        });
    }    
    $scope.orderEmailHistoryListBy = function(column, x) {   
        if (x) {
            $scope.selectedEmailHistoryFilterSortingTitle = 'SORT BY: ' +  x.value;
        }     
        $scope.emailHistoryListDir = ($scope.emailHistoryListDir == 'desc') ? 'asc' : 'desc';
        $scope.emailHistoryListColumnName = column;
        $scope.emailHistoryListOffset = 0;
        $scope.getEmailHistory();
    } 
    $scope.goToPageEmailHistory = function(page) {
        $scope.emailHistoryListOffset = page - 1;
        $scope.getEmailHistory();
    };
    $scope.setEmailHistoryFilterType = function(filterType) {
        $scope.emailHistoryListOffset = 0;
        $scope.selectedEmailHistoryFilterType = filterType;
        $scope.getEmailHistory();
    }  
    $scope.searchEmailHistoryByKey = function(event) { 
        if (event.target.value == $scope.searchEmailHistoryKey) {
            return
        }
        $scope.emailHistoryListOffset = 0;
        $scope.searchEmailHistoryKey = event.target.value ? event.target.value : '';
        $scope.getEmailHistory();
    }
    $scope.handleKeyForSearchEmailHistory = function(event) {
        if (event.which === 13 || event.keyCode === 13) {
          $scope.searchEmailHistoryByKey(event);
        }
    };
    $scope.emailHistoryClickDate = function(event) {
        angular.element(document.getElementsByClassName('currentDateCalendar')).removeClass('currentDateCalendar');
        angular.element(event.target.parentNode).addClass('currentDateCalendar');
    }
    // Send history
})