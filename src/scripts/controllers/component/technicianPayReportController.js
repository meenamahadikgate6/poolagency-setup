angular.module('POOLAGENCY')

.controller('technicianPayReportController', function($scope, $state, deviceDetector, $timeout, $rootScope, $filter, $sce, apiGateWay, service, $stateParams, ngDialog,Analytics,  $window, auth, configConstant) {
    $scope.canView = auth.getSession().viewTechnicianPay ? auth.getSession().viewTechnicianPay : 0;
    $scope.activeCustomers = 0;
    $scope.jobsCompleted = 0;
    $scope.propertyServiced = 0;
    $scope.filterReportData = ['Pay period','custom'];
    $scope.filterMonth = 'Pay period';
    $scope.seriesData = [];    
    $scope.commissionData = [];
    $scope.isCommision = false;
    $scope.isProcessingTechReport = false;

    $scope.dateModel = {
        fromDate: moment().format('DD') >= 15 ? moment(moment().format('YYYY')+'-'+moment().format('MM')+'-16').format('M/DD/YYYY') : moment().startOf('month').format('M/DD/YYYY'),
        toDate: moment().format('DD') >= 15 ? moment().endOf('month').format('M/DD/YYYY') : moment(moment().format('YYYY')+'-'+moment().format('MM')+'-15').format('M/DD/YYYY'),
        pFromDate: moment().format('DD') >= 15 ? moment(moment().format('YYYY')+'-'+moment().format('MM')+'-16').format('M/DD/YYYY') : moment().startOf('month').format('M/DD/YYYY'),
        pToDate: moment().format('DD') >= 15 ? moment().endOf('month').format('M/DD/YYYY') : moment(moment().format('YYYY')+'-'+moment().format('MM')+'-15').format('M/DD/YYYY'),
    }    
    $scope.serviceLevelData = {};
    $scope.total = {
        visits:0,
        amount:0
    }
    $scope.technicianId = $stateParams.technicianId;
    $scope.isTechDetailPage = $stateParams.technicianId ? true : false;
    $scope.techRoleModel = [];
    $scope.selectedTechnicianRole = {};
    $scope.isTechRolesExist = true;
    $scope.techPayrollId = null;
    $scope.$on("$destroy", function () {
        $rootScope.getTechRole = null;
      })
    $scope.$on("$includeContentLoaded", function(){
        $(document).ready(function() {
            $('.input-daterange-include').datepicker({
                autoclose: true,
                endDate: moment().format('M/DD/YYYY'),
                todayBtn: "linked"
            });
        });
    });
    $scope.sortRolesAlphabetically = function(roles) { 
        return roles.sort((a, b) => {
            const roleA = a.role.toLowerCase();
            const roleB = b.role.toLowerCase();    
            if (roleA < roleB) return -1;
            if (roleA > roleB) return 1;
            return 0;
        });
    }
    $rootScope.getTechRole = function(assignedRoleID){    
       
      apiGateWay.get("/tech_role", {}).then(function(response) {
        if (response.data.status == 200) {
          if(response.data.data.length > 0){
            $scope.techRoleModel = angular.copy(response.data.data)   
            $scope.techRoleModel = $scope.sortRolesAlphabetically($scope.techRoleModel);
            $scope.techRoleModel.unshift({role:'--', id:0})         
            if(assignedRoleID){
                let roleObj = $scope.techRoleModel.filter(function(item){
                    return item.id == assignedRoleID
                })
                $scope.selectedTechnicianRole = roleObj[0];
                $scope.getTechReport(roleObj[0])
            } else {
                $scope.selectedTechnicianRole = response.data.data[0];
                $scope.getTechReport($scope.techRoleModel[0])
            }
           
          }
          $scope.isTechRolesExist = response.data.data.length > 0 ? true : false;
           
        } else {
          $scope.techPayError = response.data.message;
        }     
        setTimeout(function(){
          $scope.techPayError = '';
          if (!$scope.$$phase) $scope.$apply()
        }, 2000);
      }, function(error){
        $scope.techPayError = error;  
        setTimeout(function(){
          $scope.techPayError = '';
          if (!$scope.$$phase) $scope.$apply()
        }, 2000);
      })
    } 
    $scope.filterByDays = function(filterMonth){
        $scope.dateModel.fromDate = "";
        $scope.dateModel.toDate = "";
        $scope.filterMonth = filterMonth;
        if($scope.filterMonth!='custom'){
            let currentDay = moment().format('DD');
            let currentMonth = moment().format('MM');
            let currentYear = moment().format('YYYY');
            if(currentDay >= 15){
                $scope.dateModel.fromDate = $scope.dateModel.pFromDate = angular.copy(moment(currentYear+'-'+currentMonth+'-16').format('M/DD/YYYY'));
                $scope.dateModel.toDate = $scope.dateModel.pToDate = angular.copy(moment().endOf('month').format('M/DD/YYYY'));
            } else {        
                
                $scope.dateModel.fromDate = $scope.dateModel.pFromDate =  angular.copy(moment().startOf('month').format('M/DD/YYYY'));
                $scope.dateModel.toDate = $scope.dateModel.pToDate =  angular.copy(moment(currentYear+'-'+currentMonth+'-15').format('M/DD/YYYY'));
               
            }
            if($scope.isTechDetailPage){
                $scope.getTechReport($scope.selectedTechnicianRole)
            }else{
                $scope.getAllReport()
            }
        } else{            
            $timeout(function() {
                angular.element(document.getElementById('fromDateInputTech')).focus();
            });
            
        }
    }
    $scope.nextPeriod = function(){
        const cFromDate = angular.copy($scope.dateModel.pFromDate);
        let currentDay = moment(cFromDate).format('DD');
        let currentMonth = moment(cFromDate).format('MM');
        let currentYear = moment(cFromDate).format('YYYY');    
        if(currentDay < 16){
            $scope.dateModel.fromDate = $scope.dateModel.pFromDate = moment(currentYear+'-'+currentMonth+'-16').format('M/DD/YYYY');
            $scope.dateModel.toDate = $scope.dateModel.pToDate = moment(cFromDate).endOf('month').format('M/DD/YYYY');
        } else {    
            $scope.dateModel.fromDate = $scope.dateModel.pFromDate = moment(cFromDate).add(1, 'M').startOf('month').format('M/DD/YYYY');
            $scope.dateModel.toDate = $scope.dateModel.pToDate = moment(moment($scope.dateModel.pFromDate).format('YYYY')+'-'+moment($scope.dateModel.pFromDate).format('MM')+'-15').format('M/DD/YYYY');
        }
        $scope.isCommision = false;
        if($scope.isTechDetailPage){
            $scope.getTechReport($scope.selectedTechnicianRole)
        }else{
            $scope.getAllReport()
        }
    }

    $scope.prevPeriod = function(){
        const cFromDate = angular.copy($scope.dateModel.pFromDate);
        let currentDay = moment(cFromDate).format('DD');      
        if(currentDay < 16){
            $scope.dateModel.toDate = $scope.dateModel.pToDate = moment(cFromDate).subtract(1, 'M').endOf('month').format('M/DD/YYYY');
            $scope.dateModel.fromDate = $scope.dateModel.pFromDate = moment(moment($scope.dateModel.pToDate).format('YYYY')+'-'+moment($scope.dateModel.pToDate).format('MM')+'-16').format('M/DD/YYYY');          
        } else {    
            $scope.dateModel.fromDate = $scope.dateModel.pFromDate = moment(cFromDate).startOf('month').format('M/DD/YYYY');
            $scope.dateModel.toDate = $scope.dateModel.pToDate = moment(moment($scope.dateModel.pFromDate).format('YYYY')+'-'+moment($scope.dateModel.pFromDate).format('MM')+'-15').format('M/DD/YYYY');
        }
        $scope.isCommision = false;
        if($scope.isTechDetailPage){
            $scope.getTechReport($scope.selectedTechnicianRole)
        }else{
            $scope.getAllReport()
        }
    }
    
    $scope.clickDate = function(event) {
        angular.element(document.getElementsByClassName('currentDateCalendar')).removeClass('currentDateCalendar');
        angular.element(event.target.parentNode).addClass('currentDateCalendar');
    }
    
    $scope.filterByDate = function(p) {
        if ($scope.dateModel.fromDate != '' && $scope.dateModel.toDate != '') {
            var fromDate = new Date($scope.dateModel.fromDate)
            var toDate = new Date($scope.dateModel.toDate);
            if (fromDate <= toDate) {
                $scope.filterMonth = 'custom';               
                if($scope.isTechDetailPage){
                    $scope.getTechReport($scope.selectedTechnicianRole)
                }else{
                    $scope.getAllReport()
                }
            } else {
                if (p == 'fromDate') {
                    $scope.dateModel.fromDate = '';
                } else {
                    $scope.dateModel.toDate = '';
                }
            }
        } else {
            if ($scope.dateModel.fromDate == '' && $scope.dateModel.toDate == '') {
                if($scope.isTechDetailPage){
                    $scope.getTechReport($scope.selectedTechnicianRole)
                }else{
                    $scope.getAllReport()
                }
            }
        }
    };
    $scope.getTechReport = function(role={id:0}) {
        if(role.id == undefined){ return;}
        setTimeout(function(){  
            $scope.techPayrollId = $rootScope.techPayrollId;
        }, 1000);
        $scope.selectedTechnicianRole = role;
        $scope.isProcessing = true;
        $scope.isProcessingTechPayReport = true;
        $scope.isCommision = false;
        $scope.seriesData = [];
        $scope.seriesDataUnsorted = [];
        var jobParam = {
            roleId: $scope.selectedTechnicianRole.id,
            techId: $scope.technicianId
        };     
        if (!$scope.dateModel.fromDate && !$scope.dateModel.toDate) {
            let currentDay = moment().format('DD');
            let currentMonth = moment().format('MM');
            let currentYear = moment().format('YYYY');
            if(currentDay >= 15){
                $scope.dateModel.fromDate = $scope.dateModel.pFromDate = moment(currentYear+'-'+currentMonth+'-16').format('M/DD/YYYY');
                $scope.dateModel.toDate = $scope.dateModel.pToDate = moment().endOf('month').format('M/DD/YYYY');
            } else {                
                $scope.dateModel.fromDate = $scope.dateModel.pFromDate = moment().startOf('month').format('M/DD/YYYY');
                $scope.dateModel.toDate = $scope.dateModel.pToDate = moment(currentYear+'-'+currentMonth+'-15').format('M/DD/YYYY');
            }
            //$('.input-daterange-include').datepicker('update', $scope.dateModel.fromDate, $scope.dateModel.toDate); 
        }

        jobParam.startDate = $filter('date')(new Date($scope.dateModel.fromDate), 'yyyy-MM-dd');
        jobParam.endDate = $filter('date')(new Date($scope.dateModel.toDate), 'yyyy-MM-dd');
        apiGateWay.get("/tech_report", jobParam).then(function(response) {          

            if (response.data.status == 200) {
                $scope.isProcessing = false;
                $scope.isProcessingTechPayReport = false;
                let jobList = response.data.data.jobList;
                let comList = response.data.data.jobCommissions;
                $scope.seriesData = [];
                $scope.serviceLevelData = [];
                $scope.commissionData = [];
                $scope.total = {
                    visits:0,
                    amount:0
                };
                $scope.comTotal = {
                    jobs:0,
                    amount:0
                };
                let count = 0;
                angular.forEach(jobList, function(job, index){
                    job.rate = Number(job.rate);                
                    if($scope.serviceLevelData['levelId_'+job.serviceLevelId]){                       
                        $scope.serviceLevelData['levelId_'+job.serviceLevelId].y +=  job.rate && job.cnt ? (parseFloat(job.rate)*parseFloat(job.cnt)) : 0;
                        $scope.serviceLevelData['levelId_'+job.serviceLevelId].poolType.push(job) 
                        $scope.seriesData[$scope.serviceLevelData['levelId_'+job.serviceLevelId].count].name = job.title;
                        $scope.seriesData[$scope.serviceLevelData['levelId_'+job.serviceLevelId].count].y = $scope.serviceLevelData['levelId_'+job.serviceLevelId].y
                        $scope.seriesData[$scope.serviceLevelData['levelId_'+job.serviceLevelId].count].poolType.push(job)
                        $scope.total.visits += job.cnt ? parseFloat(job.cnt) : 0;
                        $scope.total.amount += job.rate && job.cnt ? (parseFloat(job.rate)*parseFloat(job.cnt)) : 0;
                    
                    } else {
                        $scope.serviceLevelData['levelId_'+job.serviceLevelId] = {};
                        $scope.serviceLevelData['levelId_'+job.serviceLevelId].serviceLevelId = job.serviceLevelId;
                        $scope.serviceLevelData['levelId_'+job.serviceLevelId].name = job.title;
                        $scope.serviceLevelData['levelId_'+job.serviceLevelId].y = 0;
                        $scope.serviceLevelData['levelId_'+job.serviceLevelId].y += job.rate && job.cnt ? (parseFloat(job.rate)*parseFloat(job.cnt)) : 0;
                        $scope.serviceLevelData['levelId_'+job.serviceLevelId].poolType = [];
                        $scope.serviceLevelData['levelId_'+job.serviceLevelId].poolType.push(job)
                        $scope.serviceLevelData['levelId_'+job.serviceLevelId].count = angular.copy(count);
                        $scope.seriesData[$scope.serviceLevelData['levelId_'+job.serviceLevelId].count] = {name:job.title, y:$scope.serviceLevelData['levelId_'+job.serviceLevelId].y, poolType:[job]}                        
                        count++
                        $scope.total.visits += job.cnt ? parseFloat(job.cnt) : 0;
                        $scope.total.amount += job.rate && job.cnt ? (parseFloat(job.rate)*parseFloat(job.cnt)) : 0;
               
                    }

                })
                if (comList.length > 0 ) {
                    angular.forEach(comList, function(com, index){
                        var job = {
                            name: '',
                            jobId: 0,
                            jobTotal: 0,
                            jobDate: null,
                            y: 0,
                            addressId: 0
                        };
                        job = {
                            name: com.customerName,
                            jobId: com.jobId,
                            jobTotal: com.total,
                            jobDate: com.jobDate ? moment(com.jobDate).format('M/DD/YY') : null,
                            y: com.total,
                            addressId: com.addressId
                        };
                        $scope.commissionData.push(job);
                        $scope.comTotal.jobs += 1;
                        $scope.comTotal.amount += com.total ? parseFloat(com.total) : 0;
                    });
                }
                let noAccess = response.data.data.noAccess;
                if(noAccess && noAccess.length > 0){
                    $scope.seriesData.push({name:'No Access', y:noAccess[0].rate && noAccess[0].cnt ? (parseFloat(noAccess[0].rate)*parseFloat(noAccess[0].cnt)) : 0, poolType:[noAccess[0]]})         
                    $scope.total.visits += noAccess[0].cnt ? parseFloat(noAccess[0].cnt) : 0;
                    $scope.total.amount += noAccess[0].rate && noAccess[0].cnt ? (parseFloat(noAccess[0].rate)*parseFloat(noAccess[0].cnt)) : 0;
                }
            } else {
                $scope.seriesData = [];
                $scope.commissionData = [];
            }
            if (!$scope.$$phase) $scope.$apply()
            $timeout(function() {                  
                $scope.generateChart();
                $scope.generateCommissionChart();   
                $scope.isProcessing = false;
                $scope.isProcessingTechPayReport = false;
            }, 1000);
            
        },function(error){
            $scope.isProcessingTechPayReport = false;
            $scope.seriesData = [];
            $scope.commissionData = [];
        });
    };
    $scope.getAllReport = function() {
        $scope.isProcessing = true;
        $scope.isProcessingTechPayReport = true;
        $scope.isCommision = false;
        $scope.seriesData = [];
        $scope.seriesDataUnsorted = [];
       
        var jobParam = {};     
        
        if (!$scope.dateModel.fromDate && !$scope.dateModel.toDate) {
            let currentDay = moment().format('DD');
            let currentMonth = moment().format('MM');
            let currentYear = moment().format('YYYY');
            if(currentDay >= 15){
                $scope.dateModel.fromDate = $scope.dateModel.pFromDate = moment(currentYear+'-'+currentMonth+'-16').format('M/DD/YYYY');
                $scope.dateModel.toDate = $scope.dateModel.pToDate = moment().endOf('month').format('M/DD/YYYY');
            } else {                
                $scope.dateModel.fromDate = $scope.dateModel.pFromDate = moment().startOf('month').format('M/DD/YYYY');
                $scope.dateModel.toDate = $scope.dateModel.pToDate = moment(currentYear+'-'+currentMonth+'-15').format('M/DD/YYYY');
            }
            //$('.input-daterange-include').datepicker('update', $scope.dateModel.fromDate, $scope.dateModel.toDate); 
        }

        jobParam.startDate = $filter('date')(new Date($scope.dateModel.fromDate), 'yyyy-MM-dd');
        jobParam.endDate = $filter('date')(new Date($scope.dateModel.toDate), 'yyyy-MM-dd');
        apiGateWay.get("/company_tech_report", jobParam).then(function(response) {                      
            if (response.data.status == 200) {
                $scope.isProcessing = false;
                $scope.isProcessingTechPayReport = false;
                let jobList = response.data.data.jobList;
                let comList = response.data.data.jobCommissions;
                $scope.seriesData = [];
                $scope.serviceLevelData = [];
                $scope.commissionData = [];
                $scope.total = {
                    amount:0
                };
                $scope.comTotal = {
                    jobs:0,
                    amount:0
                };
                let count = 0;
                angular.forEach(jobList, function(job, index){                        
                    $scope.seriesData.push({name:job.firstName+' '+job.lastName, y:job.total ? parseFloat(job.total) : 0, techId:job.technicianId}); 
                    $scope.total.amount += job.total ? parseFloat(job.total) : 0;
                });
                if (comList.length > 0 ) {
                    angular.forEach(comList, function(com, index){
                        var job = {
                            name: '',
                            jobId: 0,
                            jobTotal: 0,
                            jobDate: null,
                            jobPay: 0,
                            salesPay: 0,
                            y: 0,
                            addressId: 0,
                            techId: 0
                        };
                        job = {
                            name: com.firstName + ' ' + com.lastName,
                            jobId: null,
                            jobTotal: com.total,
                            jobDate: null,
                            jobPay: com.totalJobPay,
                            salesPay: com.totalSalesPay,
                            y: com.total,
                            addressId: null,
                            techId: com.technicianId
                        };
                        $scope.commissionData.push(job);
                        $scope.comTotal.jobs += 1;
                        $scope.comTotal.amount += com.total ? parseFloat(com.total) : 0;
                    });
                }               
            } else {
                $scope.isTechRolesExist = false;
                $scope.seriesData = [];
                $scope.commissionData = [];
            }
            if (!$scope.$$phase) $scope.$apply()
            $timeout(function() {                   
                $scope.generateChart();
                $scope.generateCommissionChart();    
                $scope.isProcessing = false;
                $scope.isProcessingTechPayReport = false;
            }, 1000);
            
        },function(error){
            $scope.isTechRolesExist = false;
            $scope.isProcessing = false;
            $scope.isProcessingTechPayReport = false;
        });
    };
    $scope.reloadPage = function(){
        $window.location.reload();
    } 
    $scope.downloadTechPayReport = function(type='') {
        if(!$scope.checkCustomDates($scope.filterMonth, $scope.dateModel.fromDate, 'fromDateInputTech', $scope.dateModel.toDate, 'toDateInputTech')) {
            return false
        }
        var jobParam = {
            roleId: $scope.selectedTechnicianRole.id ? $scope.selectedTechnicianRole.id : 0,
            techId: $scope.technicianId
        };
        let reportApiURL = '/tech_pay_report';
        if(type == 'full'){
            jobParam = {};
            reportApiURL = '/company_tech_pay_report';
        }
        if ($scope.dateModel.fromDate != '' && $scope.dateModel.toDate != '') {
            jobParam.startDate = $filter('date')(new Date($scope.dateModel.fromDate), 'yyyy-MM-dd');
            jobParam.endDate = $filter('date')(new Date($scope.dateModel.toDate), 'yyyy-MM-dd');
        }
        $scope.showEmailInvoiceOpenPopup(jobParam, reportApiURL);
        
    };
    $scope.downloadTimeReport = function(type='') {
        var jobParam = {};
        if (type === 'isTechDetailPage') {
            jobParam.technicianId = $scope.technicianId
        }
        let reportApiURL = '/download_tech_job_tracking_report';        
        if ($scope.dateModel.fromDate != '' && $scope.dateModel.toDate != '') {
            jobParam.startDate = $filter('date')(new Date($scope.dateModel.fromDate), 'yyyy-MM-dd');
            jobParam.endDate = $filter('date')(new Date($scope.dateModel.toDate), 'yyyy-MM-dd');
        }
        $scope.showEmailInvoiceOpenPopup(jobParam, reportApiURL);
    };
    $scope.generateChart = function(){
        Highcharts.wrap(Highcharts.seriesTypes.pie.prototype, 'render', function (proceed) {
            proceed.call(this);
            
            if (!this.circle) {
                this.circle = this.chart.renderer.circle(0, 0, 0).add(this.group);
            }
            if (this.total === 0) {
                this.circle.attr({
                    cx: this.center[0],
                    cy: this.center[1],
                    r: this.center[2] / 2,
                    fill: 'none',
                    stroke: 'silver',
                    'stroke-width': 1
                });
            } else {
                this.circle.attr({
                    'stroke-width': 0
                });
            }
        });
        var isChartDivExist = document.getElementById('TECHREPORTCHART');
        if (isChartDivExist === null || isChartDivExist === undefined || !isChartDivExist) {
            return
        }
        Highcharts.chart('TECHREPORTCHART', {
			chart:{
                plotBackgroundColor: null,
                plotBorderWidth: null,
                plotShadow: false,
                type:'pie',
                height: 200,
                width: 750
            },
            exporting: { enabled: false },
            credits: { enabled: false },
            colors: ['#7cb5ec', '#91E8E0', '#F45C5B', '#2C9090', '#E6D159', '#F45985', '#7F85E3', '#DAAC98'],
            title: { text: null },           
			plotOptions: {              
                pie: {
                    point: {
                        events: {
                            legendItemClick: function(){
                                return false;
                            }
                        }
                    },
                    allowPointSelect: false,
                    cursor: 'pointer',
                    showInLegend: true,
                    dataLabels: {
                        enabled: false,                       
                        
                    },
                    size: 180,
                    center: [70,70],									
                }
            },
            tooltip: {
                pointFormat: '{point.percentage:.1f}%',                
                useHTML: true,
                style: {
                    padding: 0,
                    backgroundColor: '#000',
                    borderColor: 'black',
                    fontSize: '12px',
                },
                borderRadius: 0,
                borderWidth: 0,
                formatter: function(){
                  return '<b>'+this.point.name+'</b> <br />'+this.point.percentage.toFixed(2)+'% <br />'+$filter('currency')(this.point.y);
                }
            },
            legend: {
                enabled: true,
                layout: 'vertical',
                align: 'right',
                width: 500,
                verticalAlign: 'middle',
                useHTML: true,
                symbolHeight:15,
                symbolRadius: 2,
                reversed:false,
                labelFormatter: function() {
                   
                    let content = '<div class="custom-legend">';
                    content += '<span class="bullet" style="background-color:'+this.color+';"></span>';
                    content += !$scope.isTechDetailPage ? '<div class="key" style="width: 60%;text-transform: capitalize; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"><a class="underline-none" style="color:#333;" href="/app/techniciandetail/'+this.techId+'">' + this.name + '</a></div>' : '<div class="key" style="width: 30%;text-transform: capitalize; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">' + this.name + '</div>';
                    
                        content += '<div class="detail" style="width: 55%;">'
                        if(this.poolType && this.poolType.length > 0){
                            angular.forEach(this.poolType, function(item, index){
                                content += '<div class="flex">';
                                    content += '<div style="width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">'+(item.poolType ? item.poolType : '')+'</div>'; 
                                    content += '<div>'+item.cnt+'</div>'; 
                                    content += '<div>x</div>'; 
                                    content += '<div>'+(item.rate ? $filter('currency')(item.rate) : '$0.00')+'</div>'; 
                                    content += '<div style="margin-left: 25px; margin-right: 10px;">=</div>'; 
                                    content += '<div>'+(item.rate ? $filter('currency')(parseFloat(item.rate)*parseFloat(item.cnt)) : '$0.00')+'</div>';                              
                                content += '</div>';
                            });  
                        }       
                        content +=!$scope.isTechDetailPage ? "<div class='text-right' style='width:150px'>"+(this.y ? $filter('currency')(this.y) : '$0.00')+"</div>" : '';
                        content += '</div>'                        
                        content += '</div>';
                        return content;
                },               
            },
			series: [{
				type: 'pie',                
				data:$scope.seriesData
                
			}]
		}/*, function(chart) {
            var options = chart.options.legend;
             function clickItem(series, $legendItem, $line) {
              series.setVisible();
              $legendItem.css(
                options[series.visible ? 'itemStyle' : 'itemHiddenStyle']
              );
              $line.css({
                borderTop: '2px solid ' + (series.visible ? series.color :
                  options.itemHiddenStyle.color)
              });
            }
            // Create the legend box
            var $legend = $('<div>')
              .css({
                width: 300,
                maxHeight: 100,
                padding: 10,
                position: 'absolute',
                overflow: 'hidden',
                overflowY:'auto',
                right: 10,
                top: 40,
                borderColor: options.borderColor,
                borderWidth: options.borderWidth,
                borderStyle: 'solid',
                borderRadius: options.borderRadius
              })
              .appendTo(chart.container);
          
          
            $.each(chart.series, function(i, series) {
                var $legendItem = '';
                $.each(chart.series[0].userOptions.data, function(i, data) {
                    $legendItem += $('<div>')
                .css({
                  position: 'relative',
                  marginLeft: 20
                })
                .css(options[series.visible ? 'itemStyle' : 'itemHiddenStyle'])
                .html('<div style="width:270px; font-size:16px; font-weight:normal; line-height: 1.3;"><div style="text-align: left; float:left; ">' + data[0] + '</div><div style=" float:right;text-align:right;">$' + data[1]  + '</div></div>')
                .appendTo($legend);
                })
              
             
          
              // click handler 
              
          
            });
          }*/
          );
          
    }
    //$scope.generateCommissionChart();
    $scope.generateCommissionChart = function(){
        Highcharts.wrap(Highcharts.seriesTypes.pie.prototype, 'render', function (proceed) {
            proceed.call(this);
            
            if (!this.circle) {
                this.circle = this.chart.renderer.circle(0, 0, 0).add(this.group);
            }
            if (this.total === 0) {
                this.circle.attr({
                    cx: this.center[0],
                    cy: this.center[1],
                    r: this.center[2] / 2,
                    fill: 'none',
                    stroke: 'silver',
                    'stroke-width': 1
                });
            } else {
                this.circle.attr({
                    'stroke-width': 0
                });
            }
        });
        var isCommChartDivExist = document.getElementById('COMMREPORTCHART');
        if (isCommChartDivExist === null || isCommChartDivExist === undefined || !isCommChartDivExist) {
            return
        }
        Highcharts.chart('COMMREPORTCHART', {
			chart:{
                plotBackgroundColor: null,
                plotBorderWidth: null,
                plotShadow: false,
                type:'pie',
                height: 200,
                width: 750
            },
            exporting: { enabled: false },
            credits: { enabled: false },
            colors: ['#7cb5ec', '#91E8E0', '#F45C5B', '#2C9090', '#E6D159', '#F45985', '#7F85E3', '#DAAC98'],
            title: { text: null },           
			plotOptions: {              
                pie: {
                    point: {
                        events: {
                            legendItemClick: function(){
                                return false;
                            }
                        }
                    },
                    allowPointSelect: false,
                    cursor: 'pointer',
                    showInLegend: true,
                    dataLabels: {
                        enabled: false,                       
                        
                    },
                    size: 180,
                    center: [70,70],									
                }
            },
            tooltip: {
                pointFormat: '{point.percentage:.1f}%',                
                useHTML: true,
                style: {
                    padding: 0,
                    backgroundColor: '#000',
                    borderColor: 'black',
                    fontSize: '12px',
                },
                borderRadius: 0,
                borderWidth: 0,
                formatter: function(){
                  return '<b>'+this.point.name+'</b> <br />'+this.point.percentage.toFixed(2)+'% <br />'+$filter('currency')(this.point.y);
                }
            },
            legend: {
                enabled: true,
                layout: 'vertical',
                align: 'right',
                width: 500,
                verticalAlign: 'middle',
                useHTML: true,
                symbolHeight:15,
                symbolRadius: 2,
                reversed:false,
                labelFormatter: function() {
                    let content = '<div class="custom-legend">';
                    content += '<span class="bullet" style="background-color:'+this.color+';"></span>';
                    content += $scope.isTechDetailPage ? '<div class="key" style="width: 45%;">' : '<div class="key" style="width: 30%;text-transform: capitalize; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">';
                    content += $scope.isTechDetailPage ? '<a class="underline-none" href="/app/one-time-job/'+this.addressId+'/'+ this.jobId +'"> Job #' + this.jobId + '</a> <span style="padding-left: 15%; text-align: right;">'+ this.jobDate +'</span>' : 
                    '<a class="underline-none" href="/app/techniciandetail/'+this.techId+'">' + (this.name ? this.name : '') + '</a>';
                    content += $scope.isTechDetailPage ? '</div><div class="detail" style="width: 45% !important; margin-left: -8px;">' : '</div><div class="detail" style="width: 60% !important; margin-left: 0px;">'
                    content += '<div class="flex">';
                    content += !$scope.isTechDetailPage ? '<div style="width: 50%; color: #4e4949; text-align: right;">' + (this.jobPay ? $filter('currency')(this.jobPay) : '$0.00') + '</div>' : '';
                    content += $scope.isTechDetailPage ? '<div style="width: 100%; text-transform: capitalize;white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #4e4949;">'+ (this.name ? this.name : '') + '</div>' : '';
                    content += !$scope.isTechDetailPage ? '<div style="width: 50%; text-transform: capitalize;white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #4e4949;">'+ (this.salesPay ? $filter('currency')(this.salesPay) : '$0.00') + '</div>' : ''; 
                    content += '<div style="width: 50%; text-align: right;">'+(this.jobTotal ? $filter('currency')(this.jobTotal) : '$0.00')+'</div>';                             
                    content += '</div>';                   
                    content += '</div>'                        
                    content += '</div>';
                    return content;
                },               
            },
			series: [{
				type: 'pie',                
				data:$scope.commissionData
                
			}]
		});
          
    }
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
            template: 'sentReportEmailPopupTechProfile.html',
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
    $scope.slideNext = function(){
       $scope.isCommision = true;
       $scope.generateCommissionChart();
    }
    $scope.slidePrev = function(){
        $scope.isCommision = false;
        $scope.generateChart();
    }
    $scope.payrollSuccessMsg = false;
    $scope.payrollErrorMsg = false;
    $scope.updatePayrollId = function (newTechPayrollId) {
        // No API call if No Change
        if (newTechPayrollId == $scope.techPayrollId) {
            return;
        }

        $scope.isProcessingTechPayReport = true;
        $scope.techPayrollId = $rootScope.techPayrollId = newTechPayrollId;
        apiGateWay.send("/add_technician_payroll", { "technicianId": Number($scope.technicianId), "payrollId": $scope.techPayrollId }).then(function (response) {
            if (response.data.status == 200) {
                $scope.payrollSuccessMsg = response.data.message;
                $scope.hideMessage();
            } else {
                $scope.payrollErrorMsg = response.data.message;
                $scope.hideMessage();
            }
            $scope.isProcessingTechPayReport = false;
        }, function (error) {
            $scope.isProcessingTechPayReport = false;
            $scope.payrollErrorMsg = error;
            $scope.hideMessage();
        });
    };
    
    $scope.hideMessage = function (delay = 2000) {
        $timeout(function () {
            $scope.payrollSuccessMsg = false;
            $scope.payrollErrorMsg = false
        }, delay);
    }
});
