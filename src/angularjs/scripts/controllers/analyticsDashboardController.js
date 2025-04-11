angular.module('POOLAGENCY')
.controller('analyticsDashboardController', function($scope, apiGateWay, configConstant, ngDialog, $timeout) {  
    $scope.pageClassName = 'analytics-dashboard-page';
    document.documentElement.classList.add($scope.pageClassName);
    $scope.$on("$destroy", function () {
        document.documentElement.classList.remove($scope.pageClassName);    
    });
    $scope.cardConfig = [
        { 
          title: 'Total Companies', 
          key: 'allCompanyCount', 
          icon: 'building', 
          color: '#007bff',
          count: 0
        },
        { 
          title: 'Active Companies', 
          key: 'activeCompanyCount', 
          icon: 'building-o fa-analytics--yes', 
          color: '#28a745',
          count: 0
        },
        { 
          title: 'Subscribed Companies', 
          key: 'subscribedCompanyCount', 
          icon: 'building-o fa-analytics--payment', 
          color: '#ffc107',
          count: 0
        },
        { 
          title: 'QBO Connected Companies', 
          key: 'qboActiveCompanyCount', 
          icon: 'building-o fa-analytics--connected', 
          color: '#1abc9c',
          count: 0
        },
        { 
          title: 'Total Customers', 
          key: 'allCustomerCount', 
          icon: 'users', 
          color: '#17a2b8',
          count: 0 
        },
        { 
          title: 'ACH Payments', 
          key: 'achPaymentCount', 
          icon: 'bank', 
          color: '#dc3545',
          count: 0 
        },
        { 
          title: 'Credit Card Payments', 
          key: 'ccPaymentCount', 
          icon: 'credit-card-alt', 
          color: '#fd7e14',
          count: 0 
        },
        { 
          title: 'Technicians', 
          key: 'activeTechnicianCount', 
          icon: 'wrench', 
          color: '#6f42c1',
          count: 0 
        },
        { 
          title: 'SMS Delivered', 
          key: 'smsDeliveredInLast30Days', 
          icon: 'comment fa-analytics--yes', 
          color: '#e83e8c',
          count: 0 
        },
        { 
          title: 'SMS Failed', 
          key: 'smsFailedInLast30Days', 
          icon: 'comment fa-analytics--failed', 
          color: '#e74c3c',
          count: 0 
        },
        { 
          title: 'Email Delivered', 
          key: 'emailsDeliveredInLast30Days', 
          icon: 'envelope fa-analytics--yes', 
          color: '#6610f2',
          count: 0 
        },
        { 
          title: 'Email Bounce', 
          key: 'emailsBouncedInLast30Days', 
          icon: 'envelope fa-analytics--bounce', 
          color: '#f1c40f',
          count: 0 
        },
        { 
          title: 'Email Complaint', 
          key: 'emailsComplaintInLast30Days', 
          icon: 'envelope fa-analytics--complaint', 
          color: '#3498db',
          count: 0 
        },
        { 
          title: 'Super Admin Groups', 
          key: 'superAdminGrpCount', 
          icon: 'users fa-analytics--key', 
          color: '#8e44ad',
          count: 0 
        },
        { 
          title: 'Upcoming Invoices', 
          key: 'upcomingInvoicesOnComingFirst', 
          icon: 'file-o  fa-analytics--clock', 
          color: '#2980B9',
          count: 0 
        },
        { 
          title: 'Orenda Report', 
          key: 'orendaReport',
          icon: 'table', 
          color: '#20c997',
          report: '/send_merged_orenda_report'
        },
    ];    
    $scope.filterCards = function() {
        if (!$scope.searchQuery) {
            $scope.analyticsCards = angular.copy($scope.cardConfig);
        } else {
            $scope.analyticsCards = $scope.cardConfig.filter(function(card) {
                return card.title.toLowerCase().includes($scope.searchQuery.toLowerCase());
            });
        }
    };
    $scope.getData = function() {
        apiGateWay.get("/get_counts", {}).then(function(response) {
            if (response.data.status == 200) {
                let apiData = response.data.data;
                localStorage.setItem('apiData', JSON.stringify(apiData));
                $scope.cardConfig.forEach(function(card) {
                    if (apiData.hasOwnProperty(card.key)) {
                        card.count = apiData[card.key];
                    }
                });
                $scope.analyticsCards = angular.copy($scope.cardConfig);
                $scope.filterCards();
            }
        }, function(error){

        })
    }
    // on page load
    let cachedApiData = localStorage.getItem('apiData');
    if (cachedApiData) {
      try {
        let apiData = JSON.parse(cachedApiData);        
        $scope.cardConfig.forEach(function(card) {
            if (apiData.hasOwnProperty(card.key)) {
                card.count = apiData[card.key];
            }
        });
        $scope.analyticsCards = angular.copy($scope.cardConfig);
        $scope.filterCards();
      } catch(e) {
        console.error(e)
      }
    }
    $scope.getData();      
    // on page load  
    $scope.reportPageSentReportEmailModel = {
      email: '',
      endpoint: ''
    }
    $scope.downloadReportPopupOpen = false;
    $scope.downloadReport = function(endpoint) {
      $scope.reportPageSentReportEmailModel.endpoint = endpoint;
      $scope.reportSendSuccess = false;
      $scope.reportSendError = false;  
      $scope.downloadReportPopupOpen = true;
      ngDialog.open({
        template: 'sentReportEmail.html',
        className: 'ngdialog-theme-default v-center',
        overlay: true,
        closeByNavigation: false,
        closeByDocument: false,
        scope: $scope,
        preCloseCallback: function () {
            $scope.reportPageSentReportEmailModel = {
              email: '',
              endpoint: ''
            }
            $scope.reportSendSuccess = false;
            $scope.reportSendError = false; 
            $scope.downloadReportPopupOpen = false;     
        }
      });
    }  
    $scope.reportSending = {};
    $scope.reportSendSuccess = false;
    $scope.reportSendError = false;
    $scope.sendReport = function() {
      $scope.reportSendSuccess = false;
      $scope.reportSendError = false;
      let endpoint = angular.copy($scope.reportPageSentReportEmailModel.endpoint);
      $scope.reportSending[endpoint] = true;
      let payload = {
        email: $scope.reportPageSentReportEmailModel.email
      }
      apiGateWay.send(endpoint, payload).then(function(response) {
        $scope.reportSending[endpoint] = false;
        if (response.data.status == 200){
          $scope.reportSendSuccess = true;
          $timeout(() => {
            $scope.reportSendSuccess = false;
          }, 5000)
        } else {
          $scope.reportSendError = true;
        }
      }, function(error){
        $scope.reportSendError = true;
        $scope.reportSending[endpoint] = false;
      })
    }
});