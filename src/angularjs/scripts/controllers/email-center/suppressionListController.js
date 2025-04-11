angular.module('POOLAGENCY').controller('suppressionListController', function($rootScope, $scope, $timeout, apiGateWay, ngDialog, auth, getFroalaConfig, pendingRequests, configConstant) {
    // email suppression list starts here           
    $scope.emailSuppressionListRangeFilterData = [
        { title: '1 WEEK', value: '1 week' },
        { title: '1 MONTH', value: '1 month' },
        { title: '90 DAYS', value: '90 days' },
        { title: '6 MONTHS', value: '6 months' },
        { title: '1 YEAR', value: '1 year' },
        { title: 'CUSTOM', value: 'custom' },
    ];    
    $scope.emailSuppressionListFilterRange = function(filter) {
        $scope.emailSuppressionListListOffset = 0;
        $scope.emailSuppressionListSelectedFilterRange = filter;        
        if (filter.value==='custom') {
            $scope.emailSuppressionListFromDate = null;   
            $scope.emailSuppressionListToDate = null;  
            $(document).find('#emailSuppressionListFromDate').val('')
            $(document).find('#emailSuppressionListToDate').val('')
            setTimeout(function(){
                $scope.initEmailSuppressionListDatePickers();
                $(document).find('#emailSuppressionListFromDate').focus();                
            },100)
        } else {
            $scope.removeEmailSelection();
            $scope.getEmailSuppressionList();
        }
    }
    $scope.initEmailSuppressionListDatePickers = function() {
        $(document).ready(function() {
            $('.input-daterange').datepicker({
                autoclose: true,
                endDate: moment().format('MM-YYYY'),
                todayBtn: "linked"
            });
        });
    }
    $scope.emailSuppressionListListData = null;
    $scope.emailSuppressionListListTotalEmail = null;
    $scope.emailSuppressionListListPage = null;
    $scope.emailSuppressionListListColumnName = null;
    $scope.emailSuppressionListListLength = null;
    $scope.emailSuppressionListListDir = null;
    $scope.emailSuppressionListListOffset = null;
    $scope.emailSuppressionListListTotalPage = null;
    $scope.isEmailSuppressionListListLoading = true;
    $scope.selectedEmailSuppressionListReasonType = null;  
    $scope.emailSuppressionListDatePickerOption = {format: 'MM/DD/YYYY', showClear: false};   
    $scope.emailSuppressionListFromDate = null;   
    $scope.emailSuppressionListToDate = null;       
    $scope.emailSuppressionListFilterTypes = [
        { id: "both", label: "All" },
        { id: "bounce", label: "Bounce" },
        { id: "complaint", label: "Customer Complaint" },
        
    ];
    $scope.initPayloadForEmailSuppressionList = function() {        
        $scope.emailSuppressionListListData = [];
        $scope.emailSuppressionListListTotalEmail = 0;
        $scope.emailSuppressionListListPage = 1;
        $scope.emailSuppressionListListColumnName = 'lastUpdateTime';
        $scope.emailSuppressionListListLength = 50;
        $scope.emailSuppressionListListDir = 'desc';
        $scope.emailSuppressionListListOffset = 0;
        $scope.emailSuppressionListListTotalPage = 0;
        $scope.selectedEmailSuppressionListReasonType = $scope.emailSuppressionListFilterTypes[0]; 
        $scope.emailSuppressionListSelectedFilterRange = $scope.emailSuppressionListRangeFilterData[4];   
        $scope.suppressionAllEmailsData = [];     
        $scope.getEmailSuppressionList();
    };        
    $scope.filterEmailSuppressionListByDate = function(p) {
        let emailSuppressionListFromDateVal = $(document).find('#emailSuppressionListFromDate').val();
        let emailSuppressionListToDateVal = $(document).find('#emailSuppressionListToDate').val();
        if (emailSuppressionListFromDateVal != '' && emailSuppressionListToDateVal != '') {
            $scope.emailSuppressionListListPage = 1;
            $scope.emailSuppressionListListOffset = 0;
            $scope.emailSuppressionListListTotalPage = 0;
            $scope.emailSuppressionListFromDateVal = emailSuppressionListFromDateVal;
            $scope.emailSuppressionListToDateVal = emailSuppressionListToDateVal;
            $scope.removeEmailSelection();
            $scope.getEmailSuppressionList();
        }
    }
    $scope.searchEmailSuppressionListKey = ''; 
    $scope.emailSuppressionListFilterSortingData = [
        { id:'lastUpdateTime', value: 'Date' },
        { id:'emailAddress', value: 'Email' },
        { id:'reason', value: 'Reason' },                
    ]  
    $scope.selectedEmailSuppressionListFilterSortingTitle = 'SORT BY';   
    $scope.getEmailSuppressionList = function() {      
        $scope.isEmailSuppressionListListLoading = true;
        let emailSuppressionListPayload = {
            column: $scope.emailSuppressionListListColumnName,
            dir: $scope.emailSuppressionListListDir,
            length: $scope.emailSuppressionListListLength,
            page: $scope.emailSuppressionListListOffset,
            searchKey: $scope.searchEmailSuppressionListKey,
            reasons: $scope.selectedEmailSuppressionListReasonType ? $scope.selectedEmailSuppressionListReasonType.id : '',
            filterDuration: $scope.emailSuppressionListSelectedFilterRange.value
        }    
        if (emailSuppressionListPayload.filterDuration === 'custom') {
            if ($scope.emailSuppressionListFromDateVal && $scope.emailSuppressionListToDateVal) {
                emailSuppressionListPayload.fromDate = moment($scope.emailSuppressionListFromDateVal).format('YYYY-MM-DD');
                emailSuppressionListPayload.toDate = moment($scope.emailSuppressionListToDateVal).format('YYYY-MM-DD');
            } else {
                $scope.emailSuppressionListSelectedFilterRange = $scope.emailSuppressionListRangeFilterData[4] 
                emailSuppressionListPayload.filterDuration = $scope.emailSuppressionListSelectedFilterRange.value            
            }
        } else {
            if (emailSuppressionListPayload.fromDate) delete emailSuppressionListPayload.fromDate
            if (emailSuppressionListPayload.toDate) delete emailSuppressionListPayload.toDate
        }
        $scope.emailSuppressionListListPage =  $scope.emailSuppressionListListOffset + 1
        let endpoint = '/ses_suppression_list';
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
        apiGateWay.get(endpoint, emailSuppressionListPayload).then(function(response) {
            if (response.data.status == 200) {                    
                let responseData = response.data.data.limitedData;
                if (!$scope.getSelectedEmails().length > 0) {
                    $scope.allSuppressionEmailIds = $scope.generateAllSuppressionEmailIds(response.data.data.allIds ? response.data.data.allIds : []);
                }
                $scope.emailSuppressionListListData = [];                            
                if (responseData && responseData.length > 0) {
                    responseData.forEach(function(row){                        
                        let emailRow = {
                            date: moment(row.lastUpdateTime).format('MM/DD/YY'),
                            time: moment(row.lastUpdateTime).format('hh:mm A'),
                            reason: row.reason,
                            emailAddress: row.emailAddress,
                            id: row.id                            
                        }
                        $scope.emailSuppressionListListData.push(emailRow)
                    });
                    document.getElementById('emailSuppressionListTbody').scrollTop = 0;
                }
                $scope.emailSuppressionListListTotalEmail = response.data.data.totalCount;                
                $scope.emailSuppressionListListTotalPage = ($scope.emailSuppressionListListTotalEmail % $scope.emailSuppressionListListLength) !== 0 ? Math.ceil($scope.emailSuppressionListListTotalEmail / $scope.emailSuppressionListListLength) : Math.ceil(($scope.emailSuppressionListListTotalEmail / $scope.emailSuppressionListListLength)) - 1;
            } else {
                $scope.emailSuppressionListListData = [];
                $scope.emailSuppressionListListTotalEmail = 0;
                $scope.emailSuppressionListListTotalPage = 0;
            }
            $scope.isEmailSuppressionListListLoading = false;
        }, function(error) {
            $scope.isEmailSuppressionListListLoading = false;
            $scope.emailSuppressionListListData = [];
            $scope.emailSuppressionListListTotalEmail = 0;
            $scope.emailSuppressionListListTotalPage = 0;
        });
    }    
    $scope.orderEmailSuppressionListListBy = function(column, x) {   
        if (x) {
            $scope.selectedEmailSuppressionListFilterSortingTitle = 'SORT BY: ' +  x.value;
        }     
        $scope.emailSuppressionListListDir = ($scope.emailSuppressionListListDir == 'desc') ? 'asc' : 'desc';
        $scope.emailSuppressionListListColumnName = column;
        $scope.emailSuppressionListListOffset = 0;
        $scope.getEmailSuppressionList();
    } 
    $scope.goToPageEmailSuppressionList = function(page) {
        $scope.emailSuppressionListListOffset = page - 1;
        $scope.getEmailSuppressionList();
    };
    $scope.setEmailSuppressionListReasonType = function(filterType) {
        $scope.emailSuppressionListListOffset = 0;
        $scope.selectedEmailSuppressionListReasonType = filterType;
        $scope.removeEmailSelection();
        $scope.getEmailSuppressionList();
    }  
    $scope.searchEmailSuppressionListByKey = function(event) { 
        if (event.target.value == $scope.searchEmailSuppressionListKey) {
            return
        }
        $scope.emailSuppressionListListOffset = 0;
        $scope.searchEmailSuppressionListKey = event.target.value ? event.target.value : '';
        $scope.removeEmailSelection();
        $scope.getEmailSuppressionList();
    }
    $scope.handleKeyForSearchEmailSuppressionList = function(event) {
        if (event.which === 13 || event.keyCode === 13) {
          $scope.searchEmailSuppressionListByKey(event);
        }
    };
    $scope.suppressionAllEmailsData = [];
    $scope.generateAllSuppressionEmailIds = function(arr) {
        $scope.suppressionAllEmailsData = [];
        if (arr && arr.length > 0) {
            arr.forEach(function(item){
                let emailData = {
                    id: item,
                    selected: false
                }
                $scope.suppressionAllEmailsData.push(emailData)
            })
        }        
    }
    $scope.selectedEmailIdsForRemove = [];
    $scope.addToRemoveList = function(toggleAll=false, emailData={}) {
        if (toggleAll) {
            let isAllSelected = $scope.emailSuppressionListListTotalEmail == $scope.getSelectedEmails().length;
            if (isAllSelected) {
                $scope.suppressionAllEmailsData.forEach(emailInfo => emailInfo.selected = false);
            } else {
                $scope.suppressionAllEmailsData.forEach(emailInfo => emailInfo.selected = true);
            } 
        }
        let targetId = emailData.id;
        if ($scope.suppressionAllEmailsData && $scope.suppressionAllEmailsData.length > 0) {
            const targetEmailIndex = $scope.suppressionAllEmailsData.findIndex(emailInfo => emailInfo.id === targetId);
            if (targetEmailIndex > -1) {
                let newVal = $scope.suppressionAllEmailsData[targetEmailIndex].selected;
                $scope.suppressionAllEmailsData[targetEmailIndex].selected = newVal ? false : true;
            }
        }
    }    
    $scope.getSelectedEmails = function(onlyId=false) {
        let arr = [];
        if ($scope.suppressionAllEmailsData && $scope.suppressionAllEmailsData.length > 0) {
            arr = $scope.suppressionAllEmailsData.filter(emailInfo => emailInfo.selected)
        }
        if (onlyId) {
            let arrayOfIds = [];
            if (arr.length > 0) {
                arr.forEach(function(data){
                    arrayOfIds.push(data.id)
                })
            }
            return arrayOfIds
        }
        return arr
    }
    $scope.removeEmailSelection = function() {
        $scope.suppressionAllEmailsData.forEach(emailInfo => emailInfo.selected = false);
    }
    $scope.showCheckedIfSelected = function(emailData) {
        let isSelected = false;
        let targetId = emailData.id;
        const targetEmailIndex = $scope.suppressionAllEmailsData.findIndex(emailInfo => emailInfo.id === targetId);
        if (targetEmailIndex > -1) {
            isSelected = $scope.suppressionAllEmailsData[targetEmailIndex].selected;                
        }
        return isSelected
    }
    $scope.bulkEmailRemoving = false;  
    $scope.signleEmailRemoving = false;  
    $scope.maxEmailIdToRemove = 10;   
    $scope.emailRemoveProgressPercent = 0;   
    $scope.removeEmailsFromSuppression = () => {                
        const chunkedEamilIds = [];
        let allEmails = [];
        $scope.bulkEmailRemoving = true;
        allEmails = $scope.getSelectedEmails(true);
        for (let i = 0; i < allEmails.length; i += $scope.maxEmailIdToRemove) {
            const email = allEmails.slice(i, i + $scope.maxEmailIdToRemove);
            chunkedEamilIds.push(email);
        } 
        function saveChunkedEamilIds(index) {            
            var isFinalHit = index === chunkedEamilIds.length - 1;
            if (index < chunkedEamilIds.length) {
                const payLoad = {
                    uniqueIds: chunkedEamilIds[index],
                    isFinalHit: isFinalHit
                };                
                apiGateWay.send("/ses_suppression_list", payLoad).then(function (response) {
                    if(response.data.status == 200) {                        
                        if (isFinalHit) {
                            $scope.emailRemoveProgressPercent = 100;                            
                            setTimeout(function(){
                                $scope.bulkEmailRemoving = false;  
                                $scope.signleEmailRemoving = false;                               
                                $scope.emailRemoveProgressPercent = 0;
                                $scope.removeEmailSelection();
                                if ($scope.emailSuppressionListListData.length == 1 && $scope.emailSuppressionListListOffset > 0) {
                                    $scope.emailSuppressionListListOffset = $scope.emailSuppressionListListOffset - 1
                                }
                                $scope.getEmailSuppressionList();
                                $scope.sendEmailSuccess = 'Email(s) removed from suppression list';                                
                                $timeout(function(){ $scope.sendEmailSuccess = '' }, 3000);                                
                            }, 500)                            
                        } else {
                            $scope.emailRemoveProgressPercent = Math.ceil(((index + 1) / chunkedEamilIds.length) * 100);                                                  
                            saveChunkedEamilIds(index + 1);
                        }
                    } else {
                        $scope.bulkEmailRemoving = false;
                        $scope.signleEmailRemoving = false; 
                        $scope.emailRemoveProgressPercent = 0;
                        $scope.sendEmailError = response.data.message ? response.data.message : 'Something went wrong';
                        $timeout(function(){ $scope.sendEmailError = '' }, 3000)  
                    }         
                }, function (error) {
                    $scope.bulkEmailRemoving = false;
                    $scope.signleEmailRemoving = false; 
                    $scope.emailRemoveProgressPercent = 0;
                    $scope.sendEmailError = typeof error === 'string' ? error : 'Something went wrong';
                    $timeout(function(){ $scope.sendEmailError = '' }, 3000)             
                })
            }
        }
        saveChunkedEamilIds(0);                
    }
    // email suppression list ends here
})