angular.module('POOLAGENCY').controller('graphAreaController', function($scope, $state, deviceDetector, $timeout, $rootScope, $filter, $sce, apiGateWay, service, $stateParams, ngDialog, Analytics, configConstant, auth) {
    var getGraphConfig = function(key) {
        let graphConfig = [  
          { key: 'chlorine', label: 'Chlorine', color: '#09A381', noColor: '' },
          { key: 'ph', label: 'PH', color: '#E15F9A', noColor: '' },
          { key: 'alkalinity', label: 'Alkalinity', color: '#00CCFF', noColor: '' },
          { key: 'cya', label: 'CYA', color: '#660066', noColor: '' },
          { key: 'calcium', label: 'Calcium', color: '#FFD700', noColor: '' },
          { key: 'waterTemp', label: 'Water Temperature', color: '#FF6347', noColor: '' },
          { key: 'tds', label: 'TDS', color: '#4682B4', noColor: '' },
          { key: 'salt', label: 'Salt', color: '#A9A9A9', noColor: '#FF0000' },
          { key: 'psi', label: 'PSI', color: '#285FC6', noColor: '#FF0000' },
          { key: 'timeOnSite', label: 'Time On Site (Route Stops)', color: '#E9EC53', noColor: '' },
        ];
        return graphConfig.find(config => config.key === key);
    }
    $scope.chartConfig = {};
    // $scope.originalGraphSeries = {};
    $scope.originalGraphData = null;
    $scope.toggleRemoteDataStatus = 'show';
    $scope.toggleRemoteData = function() {
        $scope.toggleRemoteDataStatus = $scope.toggleRemoteDataStatus == 'show' ? 'hide' : 'show';
        $scope.handleGraphs($scope.originalGraphData, $scope.toggleRemoteDataStatus == 'show');
    }
    $scope.pieChemicalCostData = [];
    $scope.pieAlertTrendData = [];
    $scope.alertTrendGrpaphType = 'area';
    $scope.showPieGraphData = {
        'ALERTTREND': false
    };
    $scope.chlorineData = [];
    $scope.phData = [];
    $scope.jobData = [];
    $scope.customerModel = {};
    $scope.contactModel = {};
    $scope.dueData = [];
    $scope.filterPsiData = [];
    $scope.filterPsiNoData = [];
    $scope.saltNoData = [];
    $scope.alertCountData = [];
    $scope.addressJobDetails = [];
    $scope.timeGraphData = [];
    $scope.calciumData = [];
    $scope.waterData = [];
    $scope.tdsData = [];
    $scope.isGraphProcessing = false;
    $scope.isGraphCostProcessing = false;
    $scope.pageName = '';
    $rootScope.initGraphArea = function(addressId, waterbodyId, subJobId, pageName = '') {
        $scope.pageName = pageName;
        $scope.graphPayload = {
            addressId: addressId,
            waterBodyId: waterbodyId,
            subJobId: subJobId
        }
        if ($scope.graphPayload.addressId && $scope.graphPayload, waterbodyId) {
            $scope.getGraphDetail();
            $scope.getGraphChemicalCost();
        }
    }
    $scope.graphPayload = {
        addressId: null,
        waterBodyId: null,
        subJobId: null
    }
    $scope.showPieGraph = function(e, type) {
        $scope.alertTrendGrpaphType = type
    }
    $scope.filterModel = {
        filterMonth: '90 days'
    }
    $scope.filterGraphData = ['custom', '1 month', '90 days', '6 months', '1 year'];
    $scope.dateRangeModel = {
        graphFromDate: "",
        graphToDate: ""
    }
    $scope.filterGraph = function(i) {
        $scope.dateRangeModel.graphFromDate = '';
        $scope.dateRangeModel.graphToDate = '';
        if ($scope.filterModel.filterMonth != 'custom') {
            $scope.getGraphDetail();
            $scope.getGraphChemicalCost($scope.graphPayload.waterBodyId);
        }
    };
    $scope.graphFilterByDate = function(p) {
        if ($scope.dateRangeModel.graphFromDate != '' && $scope.dateRangeModel.graphToDate != '') {
            var graphFromDate = new Date($scope.dateRangeModel.graphFromDate)
            var graphToDate = new Date($scope.dateRangeModel.graphToDate);
            if (graphFromDate <= graphToDate) {
                $scope.filterModel.filterMonth = 'custom';
                $scope.getGraphDetail();
                $scope.getGraphChemicalCost($scope.graphPayload.waterBodyId);
            } else {
                if (p == 'graphFromDate') {
                    $scope.dateRangeModel.graphFromDate = '';
                } else {
                    $scope.dateRangeModel.graphToDate = '';
                }
            }
        } else {
            if ($scope.dateRangeModel.graphFromDate == '' && $scope.dateRangeModel.graphToDate == '') {
                $scope.getGraphDetail();
                $scope.getGraphChemicalCost($scope.graphPayload.waterBodyId);
            }
        }
    };
    $(document).ready(function() {
        $('.input-daterange').datepicker({
            autoclose: true,
            todayBtn: "linked"
        });
    });
    $rootScope.$on('ngDialog.opened', function(e, $dialog) {
        if ($dialog.name === 'chemicalCost') {
            setTimeout(function() {
                $('.input-daterange').datepicker({
                    autoclose: true,
                    endDate: moment().format('MM-YYYY'),
                    todayBtn: "linked"
                });
            }, 200);
        }
    });
    $scope.showChemicalCost = function() {
        ngDialog.open({
            template: 'chemicalCost.html',
            className: 'ngdialog-theme-default v-center',
            name: 'chemicalCost',
            scope: $scope,
            preCloseCallback: function() {}
        });
        $scope.showPie = false;
        $scope.getGraphChemicalCost($scope.graphPayload.waterBodyId);
    };
    $scope.showPieChemicalCost = function() {
        $scope.showPie = !$scope.showPie;
    };
    $scope.getGraphDetail = function() {
        $scope.isGraphProcessing = true;
        var pdata = {
            addressId: $scope.graphPayload.addressId,
            filterMonth: $scope.filterModel.filterMonth,
            waterBodyId: $scope.graphPayload.waterBodyId
        };
        if ($scope.dateRangeModel.graphFromDate != '' && $scope.dateRangeModel.graphToDate != '') {
            pdata.startDate = $filter('date')(new Date($scope.dateRangeModel.graphFromDate), 'yyyy-MM-dd');
            pdata.endDate = $filter('date')(new Date($scope.dateRangeModel.graphToDate), 'yyyy-MM-dd');
        }        
        apiGateWay.get("/graph_details", pdata).then(function(response) {
            if (response.data.status == 200) {
                $scope.originalGraphData = response;
                $scope.handleGraphs(response, $scope.toggleRemoteDataStatus == 'show')
            }
        }, function(error) {
            $scope.isGraphProcessing = false;
        })
    }
    $scope.handleGraphs = function(response, withRemoteData) {
        $scope.chlorineData = [];
        $scope.phData = [];
        $scope.jobData = [];
        $scope.filterPsiData = [];
        $scope.filterPsiNoData = [];
        $scope.saltNoData = [];
        $scope.dueData = [];
        $scope.alertCountData = [];
        $scope.pieData = [];
        $scope.pieAlertTrendData = [];
        $scope.alkalinityData = [];
        $scope.cyaData = [];
        $scope.saltData = [];
        $scope.timeGraphData = [];
        $scope.calciumData = [];
        $scope.waterData = [];
        $scope.tdsData = [];     
        let responseData = $scope.formateGraphDetails(response.data.data.addressJobDetails || [], withRemoteData)
        $scope.addressJobDetails = responseData;
        var chlorineVal = 0;
        var phVal = 0;
        var alertVal = 0;
        $scope.pieAlertTrendData = [];
        if (response.data.data.pieAlertTrend) {
            var pieAlertTrend = response.data.data.pieAlertTrend.sort(function(a, b) {
                return parseFloat(a.alertCount) - parseFloat(b.alertCount);
            });
            angular.forEach(pieAlertTrend, function(gdata) {
                $scope.pieAlertTrendData.push({
                    'name': gdata['title'],
                    'y': gdata['alertCount'],
                    pointData: gdata,
                });
            });
        }
        if (response.data.data.routeJobDurationDetails) {
            var routeJobDurationDetails = response.data.data.routeJobDurationDetails;
            if (routeJobDurationDetails.length > 0) {
                routeJobDurationDetails.forEach(function(value, index) {
                    routeJobDurationDetails[index].totalMinutes = routeJobDurationDetails[index].totalMinutes + ' mins';
                    routeJobDurationDetails[index].totalMinutes = $rootScope.calculateMins(routeJobDurationDetails[index].totalMinutes, false)
                })
            }
            angular.forEach(routeJobDurationDetails, function(gdata, index) {
                $scope.timeGraphData.push({
                    name: $filter('date')(gdata['dueDate'], 'MM/dd/yyyy'),
                    y: Number(gdata['totalMinutes']),
                    technicianName: gdata.technicianName,
                    technicianId: gdata.technicianId,
                    jobId: Number(gdata.jobId),
                    isOneOfJob: Number(gdata.isOneOfJob),
                    addressId: Number(gdata.addressId),
                    pointData: gdata,
                });
            });
        }
        angular.forEach($scope.addressJobDetails, function(gdata, index) {
            var graphDate = $filter('date')(gdata.createTime, 'MM/dd/yyyy')
            if (gdata.chemicalReading && Object.keys(gdata.chemicalReading).length > 0) {
                var chlorine = typeof gdata.chemicalReading.chlorine != 'undefined' && gdata.chemicalReading.chlorine >= 0 ? gdata.chemicalReading.chlorine : null;
                let chlorineObject = {
                    y: chlorine,
                    pointData: gdata,
                    marker: {
                        symbol: gdata.isDeviceReading ? 'url(resources/images/graph_circle/chlorine_device.svg)' : null
                    }
                }
                $scope.chlorineData.push(chlorineObject);
                var alkalinity = typeof gdata.chemicalReading.alkalinity != 'undefined' && gdata.chemicalReading.alkalinity >= 0 ? gdata.chemicalReading.alkalinity : null;
                let alkalinityObject = {
                    y: alkalinity,
                    pointData: gdata,
                    marker: {
                        symbol: gdata.isDeviceReading ? 'url(resources/images/graph_circle/alkalinity_device.svg)' : null
                    }
                }
                $scope.alkalinityData.push(alkalinityObject);
                var cya = typeof gdata.chemicalReading.cya != 'undefined' && gdata.chemicalReading.cya >= 0 ? gdata.chemicalReading.cya : null;
                let cyaObject = {
                    y: cya,
                    pointData: gdata,
                    marker: {
                        symbol: gdata.isDeviceReading ? 'url(resources/images/graph_circle/cya_device.svg)' : null
                    }
                }
                $scope.cyaData.push(cyaObject);
                var calcium = typeof gdata.chemicalReading.calcium != 'undefined' && gdata.chemicalReading.calcium >= 0 ? gdata.chemicalReading.calcium : null;
                let calciumObject = {
                    y: calcium,
                    pointData: gdata,
                    marker: {
                        symbol: gdata.isDeviceReading ? 'url(resources/images/graph_circle/calcium_device.svg)' : null
                    }
                }
                $scope.calciumData.push(calciumObject);
                var waterTemp = typeof gdata.chemicalReading.waterTemp != 'undefined' && gdata.chemicalReading.waterTemp >= 0 ? gdata.chemicalReading.waterTemp : null;
                let waterTempObject = {
                    y: waterTemp,
                    pointData: gdata,
                    marker: {
                        symbol: gdata.isDeviceReading ? 'url(resources/images/graph_circle/watertemp_device.svg)' : null
                    }
                }
                $scope.waterData.push(waterTempObject);
                var tds = typeof gdata.chemicalReading.tds != 'undefined' && gdata.chemicalReading.tds >= 0 ? gdata.chemicalReading.tds : null;
                let tdsObject = {
                    y: tds,
                    pointData: gdata,
                    marker: {
                        symbol: gdata.isDeviceReading ? 'url(resources/images/graph_circle/tds_device.svg)' : null
                    }
                }
                $scope.tdsData.push(tdsObject);
                var ph = typeof gdata.chemicalReading.ph != 'undefined' && gdata.chemicalReading.ph >= 0 ? gdata.chemicalReading.ph : null;
                let phObject = {
                    y: ph,
                    pointData: gdata,
                    marker: {
                        symbol: gdata.isDeviceReading ? 'url(resources/images/graph_circle/ph_device.svg)' : null
                    }
                }
                $scope.phData.push(phObject);
                chlorineVal = chlorineVal + (chlorine) ? parseFloat(chlorine) : 0;
                phVal = phVal + (ph) ? parseFloat(ph) : 0;
                alertVal = alertVal + (gdata.alertCount) ? parseFloat(gdata.alertCount) : 0;
                var backwash = typeof gdata.backwash != 'undefined' && gdata.backwash >= 0 ? gdata.backwash : null;
                var cleaning = typeof gdata.cleaning != 'undefined' && gdata.cleaning >= 0 ? gdata.cleaning : null;
                var brokenGauge = typeof gdata.brokenGauge != 'undefined' && gdata.brokenGauge >= 0 ? gdata.brokenGauge : null;
                var missingGauge = typeof gdata.missingGauge != 'undefined' && gdata.missingGauge >= 0 ? gdata.missingGauge : null;
                var saltCleaned = typeof gdata.saltCleaned != 'undefined' && gdata.saltCleaned >= 0 ? gdata.saltCleaned : null;
                var filterPsiColor = (typeof gdata.backwash != 'undefined' && gdata.backwash > 0) || (typeof gdata.cleaning != 'undefined' && gdata.cleaning > 0) || (typeof gdata.brokenGauge != 'undefined' && gdata.brokenGauge > 0) || (typeof gdata.missingGauge != 'undefined' && gdata.missingGauge > 0) ? getGraphConfig('psi').noColor : getGraphConfig('psi').color;
                var saltColor = (typeof gdata.saltCleaned != 'undefined' && gdata.saltCleaned > 0) ? getGraphConfig('salt').noColor : getGraphConfig('salt').color;
                var filterPsi = null;
                var marker = {};
                if (typeof gdata.chemicalReading.filterPsi != 'undefined' && gdata.chemicalReading.filterPsi >= 0 && gdata.chemicalReading.filterPsi != null) {
                    filterPsi = gdata.chemicalReading.filterPsi;
                    if (brokenGauge || missingGauge) {
                        marker = {
                            symbol: 'url(resources/images/qiconb.png)'
                        }
                    }
                    if ((brokenGauge || missingGauge) && (backwash || cleaning)) {
                        marker = {
                            symbol: 'url(resources/images/qicon.png)'
                        }
                    }
                    $scope.filterPsiData.push({
                        y: filterPsi,
                        pointData: gdata,
                        backwash: backwash,
                        cleaning: cleaning,
                        brokenGauge: brokenGauge,
                        missingGauge: missingGauge,
                        color: filterPsiColor,
                        indexValue: index,
                        marker: marker,
                        psiValue: true
                    });
                    $scope.filterPsiNoData.push(null);
                } else if (backwash || cleaning || brokenGauge || missingGauge) {
                    $scope.filterPsiData.push(null);
                    if (backwash || cleaning) {
                        marker = {
                            symbol: 'url(resources/images/qicon.png)'
                        }
                    } else {
                        marker = {
                            symbol: 'url(resources/images/qiconb.png)'
                        }
                    }
                    $scope.filterPsiNoData.push({
                        y: 0,
                        pointData: gdata,
                        backwash: backwash,
                        cleaning: cleaning,
                        brokenGauge: brokenGauge,
                        missingGauge: missingGauge,
                        color: filterPsiColor,
                        indexValue: index,
                        marker: marker,
                        psiValue: false
                    });
                } else {
                    $scope.filterPsiData.push(null);
                    $scope.filterPsiNoData.push(null);
                }
                var salt = '';
                if (typeof gdata.chemicalReading.salt != 'undefined' && gdata.chemicalReading.salt >= 0 && gdata.chemicalReading.salt != null) {
                    salt = gdata.chemicalReading.salt;
                    $scope.saltData.push({
                        y: salt,
                        pointData: gdata,
                        saltCleaned: saltCleaned,
                        color: saltColor,
                        indexValue: index,
                        saltValue: true
                    });
                    $scope.saltNoData.push(null);
                } else if (saltCleaned) {
                    $scope.saltData.push(null);
                    $scope.saltNoData.push({
                        y: 0,
                        pointData: gdata,
                        saltCleaned: saltCleaned,
                        color: saltColor,
                        indexValue: index,
                        saltValue: false
                    });
                } else {
                    $scope.saltData.push(null);
                    $scope.saltNoData.push(null);
                }
                $scope.jobData.push(gdata.chemicalReading.jobId);
                $scope.jobData.push(graphDate);
            } else {
                $scope.chlorineData.push(null);
                $scope.alkalinityData.push(null)
                $scope.saltData.push(null)
                $scope.cyaData.push(null)
                $scope.calciumData.push(null)
                $scope.waterData.push(null)
                $scope.tdsData.push(null)
                $scope.phData.push(null);
                $scope.jobData.push(null);
                $scope.filterPsiData.push(null);
                $scope.filterPsiNoData.push(null);
                $scope.saltNoData.push(null);
            }
            $scope.dueData.push(graphDate);
            $scope.alertCountData.push({ y: gdata.alertCount, pointData: gdata});
        });
        $scope.pieData.push({
            'name': 'Chlorine',
            'y': chlorineVal
        })
        $scope.pieData.push({
            'name': 'Ph',
            'y': phVal
        })
        $scope.pieData.push({
            'name': 'Alert Count',
            'y': alertVal
        })
        $timeout(function() {
            $scope.getGraph('CHEMICALTREND', 'CHLORINE/PH');
            $scope.getGraph('ALERTTREND', 'ALERT TREND');
            $scope.getGraph('PIEALERTTREND', 'ALERT TREND');
            $scope.getGraph('PSI', 'PSI');
            $scope.getGraph('ALKALINITY', 'ALKALINITY/CYA');                    
            $scope.getGraph('CALCIUMHARDNESS', 'CALCIUM HARDNESS');
            $scope.getGraph('WATERTEMP', 'WATER TEMP');
            $scope.getGraph('TDS', 'TDS');
            $scope.getGraph('SALT', 'SALT');
            $scope.getGraph('TIMEGRAPH', 'Time On Site (Route Stops)');
            $scope.isGraphProcessing = false;
        }, 100);
    }
    $scope.redirectToDetail = function(pointData) {
        if (pointData && !pointData.jobId) {
                $state.go('app.remotedatamonitoring', {
                    dataId: pointData.remoteDataId,
                    addressId: pointData.addressId,
                    deviceWaterBodyId: pointData.waterBodyId,
                });
        } else if (pointData && pointData.jobId) {
            if (pointData.isOneOfJob) {
                $state.go('app.onetimejob', {
                    addressId: pointData.addressId,
                    jobId: pointData.jobId,
                    waterBodyId: pointData.waterBodyId,
                });
            } else {
                $state.go('app.customerwaterbodydetail', {
                    addressId: pointData.addressId,
                    jobId: pointData.jobId,
                    waterBodyId: pointData.waterBodyId,
                });
            }
        }        
    }
    $scope.totalJobsCost = 0;
    $rootScope.fullJobsCost = 0;
    $scope.jobCostData = [];
    $scope.costJobData = [];
    $scope.getGraphChemicalCost = function(waterBodyId) {
        $scope.isGraphCostProcessing = true;
        var jobParam = {
            addressId: $scope.graphPayload.addressId,
            filterMonth: $scope.filterModel.filterMonth,
            waterBodyId: $scope.graphPayload.waterBodyId
        };
        if ($scope.dateRangeModel.graphFromDate != '' && $scope.dateRangeModel.graphToDate != '') {
            jobParam.startDate = $filter('date')(new Date($scope.dateRangeModel.graphFromDate), 'yyyy-MM-dd');
            jobParam.endDate = $filter('date')(new Date($scope.dateRangeModel.graphToDate), 'yyyy-MM-dd');
        }
        if (!$scope.graphPayload.addressId) {
            return
        }
        $rootScope.fullJobsCost = 0;
        apiGateWay.get("/chemicals_cost_calculation", jobParam).then(function(response) {
            if (response.data.status == 200) {
                var jobCostResponse = response.data.data;
                $scope.totalJobsCost = jobCostResponse.totalJobsCost;
                $scope.totalJobsCost = $scope.totalJobsCost ? parseFloat($scope.totalJobsCost).toFixed(2) : '0.00';
                $scope.costJobData = [];
                $scope.jobCostData = [];
                $scope.totalCostPerJobData = jobCostResponse.totalCostPerJobData;
                $scope.totalJobs = $scope.totalCostPerJobData.length;
                $scope.pieChemicalCost = jobCostResponse.pieCostData;
                angular.forEach($scope.totalCostPerJobData, function(gdata) {
                    $scope.costJobData.push($filter("date")(gdata.jobCreateTime, "MM/dd/yyyy"));
                    $scope.jobCostData.push(gdata.totalCostPerJob);
                    if (gdata.jobId == Number($scope.graphPayload.subJobId)) {
                        $rootScope.fullJobsCost = gdata.totalCostPerJob ? parseFloat(gdata.totalCostPerJob).toFixed(2) : '0.00';
                    }
                });
                $scope.pieChemicalCostData = [];
                var pieCostData = jobCostResponse.pieCostData;
                if (pieCostData) {
                    pieCostData.sort(function(a, b) {
                        return parseFloat(a.chemicalCost) - parseFloat(b.chemicalCost);
                    });
                }
                angular.forEach(pieCostData, function(gdata) {
                    $scope.pieChemicalCostData.push({
                        'name': gdata['keyValue'],
                        'y': gdata['chemicalCost']
                    })
                });
                $timeout(function() {
                    $scope.getGraph('CHEMICALCOST', 'CHEMICAL COST');
                    $scope.getGraph('PIECHEMICALCOST', 'CHEMICAL COST');
                }, 1200);
            } else {
                $scope.totalCostPerJobData = [];
                $scope.costJobData = [];
                $scope.jobCostData = [];
            }
            $scope.isGraphCostProcessing = false;
        }, function(error) {
            $scope.isGraphCostProcessing = false;
            var analyticsData = {};
            analyticsData.requestData = jobParam;
            analyticsData.userData = $rootScope.userSession;
            analyticsData.actionTime = new Date();
            analyticsData.errorData = error;
            var analyticsDataString = JSON.stringify(analyticsData);
            var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
            $rootScope.storeAnalytics('Error - Get Chemical Cost Info', "Error on getGraphChemicalCost - " + currentDateTime, analyticsDataString, 0, true);
        });
    };
    var formateNumberString = function(numValue, chartname) {
        if (chartname == 'PIECHEMICALCOST' || chartname == 'CHEMICALCOST') {
            numValue = numValue.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,').replace('.00', '');
        }
        return numValue;
    }
    $scope.getGraph = function(chartname, charttitle) {
        var spacingTop = -2;
        var xAxisEnabled = false;
        var legendEnabled = true;
        var xAxisCats = $scope.dueData;
        var cats = [];
        var type = "area";
        var positioner = function(boxWidth, boxHeight, point) {
            var chart = this.chart,
                plotLeft = chart.plotLeft,
                plotTop = chart.plotTop,
                plotWidth = chart.plotWidth,
                plotHeight = chart.plotHeight,
                distance = 5,
                pointX = point.plotX,
                pointY = point.plotY,
                x = pointX + plotLeft + (chart.inverted ? distance : -boxWidth - distance),
                y = pointY - boxHeight + plotTop + 15,
                alignedRight;
            if (x < 7) {
                x = plotLeft + pointX + distance;
            }
            if ((x + boxWidth) > (plotLeft + plotWidth)) {
                x -= (x + boxWidth) - (plotLeft + plotWidth);
                y = pointY - boxHeight + plotTop - distance;
                alignedRight = true;
            }
            if (y < plotTop + 5) {
                y = plotTop + 5;
                if (alignedRight && pointY >= y && pointY <= (y + boxHeight)) {
                    y = pointY + plotTop + distance;
                }
            }
            if (y + boxHeight > plotTop + plotHeight) {
                y = Math.max(plotTop, plotTop + plotHeight - boxHeight - distance); // below
            }
            return {
                x: x,
                y: y
            };
        };
        var tooltipData = {
            useHTML: true,
            style: {
                padding: 0,
                backgroundColor: '#000',
                borderColor: 'black',
                fontSize: '12px',
            },
            borderRadius: 0,
            borderWidth: 0,
            formatter: function() {
                let prefix = '';
                if (this.point.pointData && this.point.pointData.isDeviceReading) {
                    prefix = '<span style="color:#285fc6;font-weight: 600">From Water Guru</span></br>'
                }
                return prefix + '<span style="color:' + this.point.color + '">\u25CF</span> ' + this.key + ': <b>' + formateNumberString(this.point.y, chartname) + '</b>';
            },
            positioner: positioner
        }
        var yaxis = {
            offset: -10,
            title: {
                enabled: false
            },
            categories: cats,
            labels: {
                formatter: function() {
                    return this.value;
                },
                style: {
                    color: '#909ca9'
                }
            }
        };            
        if (chartname == "PIECHEMICALCOST") {
            type = "pie";
            spacingTop = 0;
            tooltipData = {
                useHTML: true,
                style: {
                    padding: 0,
                    backgroundColor: '#000',
                    borderColor: 'black',
                    fontSize: '12px',
                },
                borderRadius: 0,
                borderWidth: 0,
                formatter: function() {
                    return this.key + '<br/><b>$' + formateNumberString(this.point.y, chartname) + '</b>';
                },
                positioner: positioner
            }
        }
        if (chartname == "PIEALERTTREND") {
            type = "pie";
            spacingTop = 0;
        }
        if (chartname == "PSI") {
            tooltipData = {
                useHTML: true,
                formatter: function() {
                    var backwash = '';
                    var cleaned = '';
                    var brokenGauge = '';
                    var missingGauge = '';
                    if (this.point.backwash) {
                        backwash = '<br /> <span style="color:'+getGraphConfig('psi').noColor+'">\u25CF</span> Backwashed';
                    }
                    if (this.point.cleaning) {
                        cleaned = '<br /> <span style="color:'+getGraphConfig('psi').noColor+'">\u25CF</span> Cleaned';
                    }
                    if (this.point.brokenGauge) {
                        brokenGauge = '<br /> <span style="color:'+getGraphConfig('psi').color+'">\u25CF</span> Broken PSI Gauge';
                    }
                    if (this.point.missingGauge) {
                        missingGauge = '<br /> <span style="color:'+getGraphConfig('psi').color+'">\u25CF</span> Missing PSI Gauge';
                    }
                    return '<span style="color:'+getGraphConfig('psi').color+'">\u25CF</span> ' + this.key + (this.point.y != null && this.point.psiValue ? '<b>: ' + formateNumberString(this.point.y, chartname) + '</b>' : '') + backwash + cleaned + brokenGauge + missingGauge;
                },
                positioner: positioner
            }
        }
        if (chartname == "SALT") {
            tooltipData = {
                useHTML: true,
                formatter: function() {
                    var saltCleaned = '';
                    if (this.point.saltCleaned) {
                        saltCleaned = '<br /> <span style="color:'+getGraphConfig('salt').noColor+'">\u25CF</span> Cell Cleaned';
                    }
                    return '<span style="color:'+getGraphConfig('salt').color+'">\u25CF</span> ' + this.key + (this.point.y != null && this.point.saltValue ? '<b>: ' + formateNumberString(this.point.y, chartname) + '</b>' : '') + saltCleaned;
                },
                positioner: positioner
            }
        }
        if(chartname == "CALCIUMHARDNESS"){
            type = "area";
            legendEnabled = false;
        }
        if(chartname == "WATERTEMP"){
            type = "area";
            legendEnabled = false;
        }
        if(chartname == "TDS"){
            type = "area";
            legendEnabled = false;
        }
        if (chartname == "TIMEGRAPH") {
            tooltipData = {
                useHTML: true,
                formatter: function() {
                    return '<span style="color:'+getGraphConfig('timeOnSite').color+'">\u25CF</span>  ' + this.point.name + ': <b> ' + this.point.y + ' </b> minutes<br/>Technician: <b style="text-transform: capitalize;">' + this.point.technicianName + '</b>';
                },
                positioner: positioner
            }
        }
        if (chartname == 'CHEMICALCOST') {
            tooltipData = {
                useHTML: true,
                formatter: function() {
                    return this.x + '\n</br><b>$' + formateNumberString(this.y, chartname) + '</b>';
                }
            }
            spacingTop = 2;
            legendEnabled = false;
            xAxisCats = $scope.costJobData;
        }
        $scope.chartConfig[chartname] = {};            
        var pieData = {
            dataLabels: {
                enabled: false
            },
            showInLegend: false
        }
        if (chartname == "PIEALERTTREND") {
            pieData['size'] = '70%';
        }
        var isChartDivExist = document.getElementById(chartname);
        if (isChartDivExist === null || isChartDivExist === undefined || !isChartDivExist) {
            return
        }
        $scope.chartConfig[chartname] = Highcharts.chart(chartname, {
            chart: {
                type: type,
                zoomType: 'x',
                spacingBottom: 7,
                spacingTop: spacingTop,
                spacingLeft: 1,
                events: {
                    load: function(event) {
                        event.target.reflow();
                    },
                    click: function(evt) {
                    }
                }
            },
            title: {
                text: charttitle,
                align: 'left',
                y: 30,
                x: 30,
                style: {
                    color: '#34495e',
                    fontSize: '14px',
                    fontWeight: '700',
                }
            },
            tooltip: tooltipData,
            subtitle: {
                enabled: false
            },
            legend: {
                itemStyle: {
                    color: '#34495e',
                    fontWeight: 'normal'
                },
                enabled: legendEnabled,
                verticalAlign: 'top',
                floating: false,
                align: 'right',
                x: 10,
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
                    pointWidth: 5,
                },
                dataLabels: {
                    enabled: true
                },
                pie: pieData,
                series: {
                    borderWidth: .1,
                    connectNulls: true,
                    point: {
                        events: {
                            click: function(evt) {
                                $scope.redirectToDetail(evt.point.pointData);
                            }
                        }
                    },
                    marker: {
                        enabled: true,
                        radius: 4
                    }
                }
            },
            xAxis: {
                tickWidth: 0,
                offset: 0,
                title: {
                    enabled: true
                },
                categories: xAxisCats,
                labels: {
                    enabled: xAxisEnabled
                }
            },
            yAxis: yaxis,
            credits: {
                enabled: false
            },
            exporting: {
                enabled: false
            }
        });
        if (chartname == 'CHEMICALTREND') {
            var chlorineSeries = {
                name: 'Chlorine',
                data: $scope.chlorineData,
                lineWidth: 1,
                color: getGraphConfig('chlorine').color
            };
            var phSeries = {
                name: 'PH',
                color: getGraphConfig('ph').color,
                lineWidth: 1,
                data: $scope.phData
            };
            $scope.chartConfig[chartname].addSeries(chlorineSeries);
            $scope.chartConfig[chartname].addSeries(phSeries);
        }
        if (chartname == 'PIEALERTTREND') {
            var costSeries = {
                name: '',
                data: $scope.pieChemicalCostData,
                lineWidth: 1,
                color: '#c0e29e'
            };
            $scope.chartConfig[chartname].addSeries(costSeries);
        }
        if (chartname == 'PIECHEMICALCOST') {
            var costSeries = {
                name: '',
                data: $scope.pieChemicalCostData,
                lineWidth: 1,
                color: '#c0e29e'
            };
            $scope.chartConfig[chartname].addSeries(costSeries);
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
        if (chartname == 'CHEMICALCOST') {
            var costSeries = {
                name: '',
                data: $scope.jobCostData,
                lineWidth: 1,
                color: '#c0e29e'
            };
            $scope.chartConfig[chartname].addSeries(costSeries);
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
        if (chartname == 'ALERTTREND') {
            var alertSeries = {
                name: 'Alert Trend',
                color: '#ee6e12',
                lineWidth: 1,
                data: $scope.alertCountData
            };
            $scope.chartConfig[chartname].addSeries(alertSeries);
        }
        if (chartname == 'PIEALERTTREND') {
            var alertSeries = {
                name: 'Alert Trend',
                color: '#ee6e12',
                lineWidth: 1,
                data: $scope.pieAlertTrendData
            };
            $scope.chartConfig[chartname].addSeries(alertSeries);
        }
        if (chartname == 'PSI') {
            var psiSeries = {
                name: 'PSI',
                color: getGraphConfig('psi').color,
                lineWidth: 1,
                data: $scope.filterPsiData
            };
            var psiNoSeries = {
                name: 'NO PSI',
                color: getGraphConfig('psi').noColor,
                lineWidth: 1,
                data: $scope.filterPsiNoData,
            };
            $scope.chartConfig[chartname].addSeries(psiSeries);
            $scope.chartConfig[chartname].addSeries(psiNoSeries);
        }
        if (chartname == 'ALKALINITY') {
            var alkalinitySeries = {
                name: 'ALKALINITY',
                color: getGraphConfig('alkalinity').color,
                lineWidth: 1,
                data: $scope.alkalinityData
            };
            var cyaSeries = {
                name: 'CYA',
                color: getGraphConfig('cya').color,
                lineWidth: 1,
                data: $scope.cyaData
            };
            $scope.chartConfig[chartname].addSeries(alkalinitySeries);
            $scope.chartConfig[chartname].addSeries(cyaSeries);
        }
        if (chartname == 'SALT') {
            var saltSeries = {
                name: 'SALT',
                color: getGraphConfig('salt').color,
                lineWidth: 1,
                data: $scope.saltData
            };
            var saltNoSeries = {
                name: 'NO SALT',
                color: getGraphConfig('salt').noColor,
                lineWidth: 0,
                data: $scope.saltNoData,
                marker: {
                    symbol: 'url(resources/images/qicon.png)'
                }
            };
            $scope.chartConfig[chartname].addSeries(saltSeries);
            $scope.chartConfig[chartname].addSeries(saltNoSeries);
        }
        if (chartname == 'CALCIUMHARDNESS') {
            var calciumSeries = {
                name: 'CALCIUM HARDNESS',
                color: getGraphConfig('calcium').color,
                lineWidth: 1,
                data: $scope.calciumData
            };
            $scope.chartConfig[chartname].addSeries(calciumSeries);
        }
        if (chartname == 'WATERTEMP') {
            var waterTempSeries = {
                name: 'WATER TEMP',
                color: getGraphConfig('waterTemp').color,
                lineWidth: 1,
                data: $scope.waterData
            };
            $scope.chartConfig[chartname].addSeries(waterTempSeries);
        }
        if (chartname == 'TDS') {
            var tdsSeries = {
                name: 'TDS',
                color: getGraphConfig('tds').color,
                lineWidth: 1,
                data: $scope.tdsData
            };
            $scope.chartConfig[chartname].addSeries(tdsSeries);
        }
        if (chartname == 'TIMEGRAPH') {
            var timeSeries = {
                name: 'TIMEGRAPH',
                color: getGraphConfig('timeOnSite').color,
                lineWidth: 1,
                data: $scope.timeGraphData
            };
            var noTimeSeries = {
                name: 'TIMEGRAPH',
                color: getGraphConfig('timeOnSite').color,
                lineWidth: 0,
                data: [],
                marker: {
                    symbol: 'url(resources/images/qicon.png)'
                }
            };
            $scope.chartConfig[chartname].addSeries(timeSeries);
            $scope.chartConfig[chartname].addSeries(noTimeSeries);
        }
    };
    
    
    $scope.chartSize = {
        'width': '329',
        'height': '200'
    };
    if (screen.width >= 320 && screen.width <= 480) {
        $scope.chartSize = {
            'width': '320',
            'height': '200'
        };
    }
    if (screen.width >= 481 && screen.width <= 640) {
        $scope.chartSize = {
            'width': '390',
            'height': '300'
        };
    }
    if (screen.width >= 641 && screen.width <= 960) {
        $scope.chartSize = {
            'width': '470',
            'height': '300'
        };
    }
    if (screen.width >= 961 && screen.width <= 1024) {
        $scope.chartSize = {
            'width': '600',
            'height': '300'
        };
    }
    if (screen.width >= 1025 && screen.width <= 1280) {
        $scope.chartSize = {
            'width': '320',
            'height': '200'
        };
    }
    $scope.chartSizeData = [];
    $scope.expandCollapse = function(event, id) {
        var graphArray = ['CHEMICALTREND', 'ALERTTREND', 'PIEALERTTREND', 'PSI', 'ALKALINITY', 'CALCIUMHARDNESS', 'SALT', 'TIMEGRAPH'];
        var i = graphArray.indexOf(id);
        var newArray = graphArray;
        newArray.splice(newArray.indexOf(id), 1);
        try {
            angular.forEach(newArray, function(value) {
                if (angular.element(document.getElementById("href-" + value)).hasClass('expandClass')) {
                    angular.element(document.getElementById("href-" + value)).removeClass("expandClass");
                    angular.element(document.getElementById(value)).css('min-width', '0').css('height', '200px');
                    $scope.chartConfig[value].setSize($scope.chartSize.width, $scope.chartSize.height);
                    $scope.chartConfig[id].setSize($scope.chartSize.width, $scope.chartSize.height);
                }
            });
        } catch (e) {}
        if (angular.element(event.target.parentNode).hasClass('expandClass')) {
            angular.element(event.target.parentNode).removeClass("expandClass");
            angular.element(document.getElementById(id)).css('min-width', '0').css('height', '200px');
            $scope.chartConfig[id].setSize($scope.chartSize.width, $scope.chartSize.height);
        } else {
            angular.element(document.getElementById('mainChemical')).prepend(document.getElementById(id + "-div"));
            angular.element(event.target.parentNode).addClass("expandClass");
            angular.element(document.getElementById(id)).css('min-width', '669px').css('height', '411px');
            $scope.chartConfig[id].setSize('669', '411');
        }
    };
    $scope.sortByChronological = function(arr) {
        let sortedArr = arr.sort((a, b) => new Date(a.createTime) - new Date(b.createTime));
        return sortedArr;
    }
    $scope.getGraphPointerValue = function(val) {
        if (val === null || val === undefined || val === '') {
            return null;
        } else if (typeof val === 'string') {
            return Number(val);
        } else if (typeof val === 'number') {
            return val;
        }
    };
    $scope.formateGraphDetails = function(arr, withRemoteData) {
        let formattedArray = [];
        arr.forEach(function(item) {
            let hasDeviceReading = !item.hasOwnProperty('jobId');
            let hasChemicalReading = item.hasOwnProperty('chemicalReading');
            let formattedObject = {
                "addressId": Number($scope.graphPayload.addressId),
                "isDeviceReading": hasDeviceReading,
                "remoteDataId": item.id ?? null,
                "jobId": item.jobId ?? null,
                "createTime": item.createTime,
                "waterBodyId": Number($scope.graphPayload.waterBodyId),
                "chemicalReading": null,
                "alertCount": item.alertCount ?? null,
                "backwash": item.backwash ?? null,
                "brokenGauge": item.brokenGauge ?? null,
                "cleaning": item.cleaning ?? null,
                "dueDate": item.dueDate ?? null,
                "firstName": item.firstName ?? null,
                "installerId": item.installerId ?? null,
                "isOneOfJob": item.isOneOfJob ?? null,
                "jobAssignTime": item.jobAssignTime ?? null,
                "lastName": item.lastName ?? null,
                "missingGauge": item.missingGauge ?? null,
                "parentId": item.parentId ?? null,
                "saltCleaned": item.saltCleaned ?? null,
                "technicianId": item.technicianId ?? null,
            }
            if (hasDeviceReading && withRemoteData) {
                let _item = item;
                formattedObject.chemicalReading = {
                    "alkalinity": $scope.getGraphPointerValue(_item.alkalinity_device),
                    "chlorine": $scope.getGraphPointerValue(_item.chlorine_device),
                    "cya": $scope.getGraphPointerValue(_item.cyanuricAcid_device),
                    "filterPsi": $scope.getGraphPointerValue(_item.filterPsi_device),
                    "calcium": $scope.getGraphPointerValue(_item.calcium_device),
                    "ph": $scope.getGraphPointerValue(_item.ph_device),
                    "salt": $scope.getGraphPointerValue(_item.salt_device),
                    "waterTemp": $scope.getGraphPointerValue(_item.waterTemp_device),
                    "tds": $scope.getGraphPointerValue(_item.tds_device),
                }
            } else if (hasChemicalReading) {
                let _item = item.chemicalReading;
                formattedObject.chemicalReading = {
                    "alkalinity":  $scope.getGraphPointerValue(_item.alkalinity),
                    "chlorine": $scope.getGraphPointerValue(_item.chlorine),
                    "cya": $scope.getGraphPointerValue(_item.cya),
                    "filterPsi": $scope.getGraphPointerValue(_item.filterPsi),
                    "calcium": $scope.getGraphPointerValue(_item.calcium),
                    "ph": $scope.getGraphPointerValue(_item.ph),
                    "salt": $scope.getGraphPointerValue(_item.salt),
                    "waterTemp": $scope.getGraphPointerValue(_item.waterTemp),
                    "tds": $scope.getGraphPointerValue(_item.tds),
                }                
            }
            formattedArray.push(formattedObject)
        })
        formattedArray = $scope.sortByChronological(formattedArray)
        return formattedArray;
    }
});