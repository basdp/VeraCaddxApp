angular.module('starter.controllers', [])

    .controller('AppCtrl', function($scope, $ionicModal, $timeout) {

        // With the new view caching in Ionic, Controllers are only called
        // when they are recreated or on app start, instead of every page change.
        // To listen for when this page is active (for example, to refresh data),
        // listen for the $ionicView.enter event:
        //$scope.$on('$ionicView.enter', function(e) {
        //});

        // Form data for the login modal
        $scope.loginData = {};
        
        /*ionic.Platform.ready(function(){
            StatusBar.styleBlackOpaque();
        });*/

        // Create the login modal that we will use later
        $ionicModal.fromTemplateUrl('templates/login.html', {
            scope: $scope
        }).then(function(modal) {
            $scope.modal = modal;
        });

        // Triggered in the login modal to close it
        $scope.closeLogin = function() {
            $scope.modal.hide();
        };

        // Open the login modal
        $scope.login = function() {
            $scope.modal.show();
        };

        // Perform the login action when the user submits the login form
        $scope.doLogin = function() {
            console.log('Doing login', $scope.loginData);

            // Simulate a login delay. Remove this and replace with your login
            // code if using a login system
            $timeout(function() {
                $scope.closeLogin();
            }, 1000);
        };
    })

    .controller('SettingsCtrl', function($scope, $stateParams, $timeout, $http) {
        $scope.$on('$ionicView.enter', function(e) {
            $scope.vera_id = localStorage.getItem("vera_id");
            $scope.vera_command_url = localStorage.getItem("vera_command_url");
        });
        
        $scope.breakConnection = function() {
            navigator.notification.confirm("Weet je zeker dat je de connectie met Vera wilt verbreken?", function(res) {
                $scope.$apply(function() {
                    if (res === 1) {
                        $scope.vera_command_url = null;
                        $scope.vera_id = null;
                        localStorage.removeItem("vera_id");
                        localStorage.removeItem("vera_command_url");
                    }
                });
            }, "Connectie verbreken", ["Ja", "Nee"]);
        }
        
        $scope.makeConnection = function() {
            var ref = window.open('https://home.getvera.com/', '_blank', 'location=yes,closebuttoncaption=Annuleer');
            //ref.addEventListener('loadstart', function(event) { alert('start: ' + event.url); });
            ref.addEventListener('loadstop', function(event) {
                //alert('stop: ' + event.url);
                if (event.url.match(/https:\/\/vera-[a-z]{2}-oem-relay[0-9]+\.mios\.com\/www\/[0-9a-z\.\-]+\/\?PK_Device/ig)) {
                    //alert("Logged in to Vera");
                    ref.insertCSS({code: "#div_content, .navbar-toggle { display: none; }"});
                    
                    function checkDCU() {
                        ref.executeScript({ code: "window.data_command_url" }, function(data_command_url) {
                            //alert("Got data command url from Vera:\n" + data_command_url);
                            if (data_command_url == '') {
                                $timeout(function() {
                                    checkDCU();
                                }, 1000);
                            } else {
                                ref.close();
                                $http.get(data_command_url + "id=user_data&output_format=json").then(function(response) {
                                    localStorage.setItem("vera_id", response.data.PK_AccessPoint);
                                    localStorage.setItem("vera_command_url", data_command_url);
                                    $scope.vera_id = localStorage.getItem("vera_id");
                                    $scope.vera_command_url = localStorage.getItem("vera_command_url");
                                });
                            }
                        });
                    }      
                    checkDCU();              
                }
             });
            //ref.addEventListener('loaderror', function(event) { alert('error: ' + event.message); });
            //ref.addEventListener('exit', function(event) { alert(event.type); });

        };
    })

    .controller('HomeCtrl', function($scope, $timeout, $interval, $sce, $http, $state, $ionicHistory) {
        var origBackElem = angular.element(document.querySelector("ion-nav-bar > div.nav-bar-block[nav-bar='active'] > ion-header-bar button.ion-navicon"));
        
        $scope.atChar = 1;
        $scope.code = "";
        $scope.unlockText = "";
        $scope.service = '';
        $scope.deviceId = '';
        $scope.currentAction = null;
        
        $scope.armed = false;
        $scope.lockStatus = "Aanwezig";
        
        $scope.update = function(showSpinner, callback) {
            if (showSpinner || showSpinner === undefined) {
                $scope.lockStatus = "";
            }
            
            if (!$scope.vera_command_url) { return; }
            
            $http.get($scope.vera_command_url + "id=user_data&output_format=json").then(function(response) {
                $scope.armed = true;
                response.data.devices.forEach(function(device) {
                    if (device.name == "Partition 1") {
                        $scope.deviceId = device.id;
                        device.states.forEach(function(state) {
                            if (state.variable == 'ArmMode') {
                                console.log('Alarm ArmMode: ' + state.value);
                                if (state.value == 'Disarmed') {
                                     $scope.lockStatus = "Uitgeschakeld";
                                     $scope.armed = false;
                                }
                                $scope.service = state.service;
                            }
                            if (state.variable == 'DetailedArmMode') {
                                console.log('Alarm DetailedArmMode: ' + state.value);
                                if (state.value == 'Stay') $scope.lockStatus = "Aanwezig"; 
                                if (state.value == 'Armed') $scope.lockStatus = "Afwezig";
                                if (state.value == 'ExitDelay') $scope.lockStatus = "Activeren...";
                                $scope.service = state.service; 
                            }
                        });
                    }
                });
                if (callback) callback();
            });
        };
        
        $scope.$on("$ionicView.enter", function(scopes, states) {
            origBackElem.css('opacity', 0);
            ionic.Platform.ready(function(){
                if (window.StatusBar) StatusBar.styleBlackOpaque();
            });
            
            $scope.vera_id = localStorage.getItem("vera_id");
            $scope.vera_command_url = localStorage.getItem("vera_command_url");
            $scope.update();
            $interval(function() {
                if (!$scope.isCodeEntering) {
                    $scope.update(false);
                }
            }, 10 * 1000);
        });

        $scope.$on("$ionicView.leave", function(scopes, states) {
            origBackElem.css('opacity', '');
            StatusBar.styleDefault();
        });
        
        $scope.buttonUp = function($event) {
            var elem = $event.currentTarget;
            (function(elem){
            elem.addClass('active');
            $timeout(function() {
                elem.removeClass('active');                
            }, 50);
            })(elem);
        };
        
        $scope.buttonDown = function($event) {
            var elem = $event.currentTarget;
            elem.addClass('active');
        };
        
        $scope.buttonPressed = function(char) {
            if (char === undefined) {
                // backspace
                if ($scope.atChar > 1) {
                    $scope.atChar--;
                    $scope.code = $scope.code.substr(0, $scope.atChar - 1);
                }
            } else {
                if ($scope.atChar < 5) {
                    $scope.atChar++;
                    $scope.code += char;
                }
            }
            console.log("code: " + $scope.code);
            
            if ($scope.atChar == 5) {
                if ($scope.currentAction == 'disarm') {
                    $http.get($scope.vera_command_url + "id=lu_action&output_format=json&DeviceNum=" + $scope.deviceId + "&serviceId=" + $scope.service + "&action=RequestArmMode&State=Disarmed&PINCode=" + $scope.code).then(function(response) {
                        $timeout(function() {
                            $scope.update(true, function() {
                                if (!$scope.armed) {
                                    $scope.cancelCode();
                                } else {
                                    navigator.notification.alert("Code is onjuist", function() {}, "Alarm Systeem", "OK");
                                    $scope.atChar = 1;
                                    $scope.code = "";
                                }
                            });
                        }, 1000);
                    });
                }
            }
        }
        
        $scope.cancelCode = function() {
            $scope.isCodeEntering = false;
            angular.element(document.getElementsByClassName("lock-buttons")).removeClass("hidden");
            angular.element(document.getElementsByClassName("lock-status")).removeClass("hidden");    
            angular.element(document.getElementsByClassName("code")).addClass("hidden");
            angular.element(document.getElementsByClassName("keypad")).addClass("hidden"); 
            $timeout(function() { $scope.code = ''; $scope.atChar = 1; }, 500);           
        }
        
        $scope.arm_home = function() {
            /*angular.element(document.getElementsByClassName("lock-buttons")).addClass("hidden");
            angular.element(document.getElementsByClassName("lock-status")).addClass("hidden"); 
            angular.element(document.getElementsByClassName("code")).removeClass("hidden");
            angular.element(document.getElementsByClassName("keypad")).removeClass("hidden");
            $scope.unlockText = $sce.trustAsHtml("Voer code in om alarm op <b>Aanwezig</b> te zetten");*/
            
            if ($scope.service == '' || $scope.deviceId == '') {
                alert("Fout bij het ophalen van de status. Ververs de app eerst.");
                return;
            }
            
            $http.get($scope.vera_command_url + "id=lu_action&output_format=json&DeviceNum=" + $scope.deviceId + "&serviceId=" + $scope.service + "&action=RequestArmMode&State=Stay&PINCode=").then(function(response) {
                $scope.update();
            });

            
        };
        
        $scope.arm_full = function() {
            /*angular.element(document.getElementsByClassName("lock-buttons")).addClass("hidden");
            angular.element(document.getElementsByClassName("lock-status")).addClass("hidden"); 
            angular.element(document.getElementsByClassName("code")).removeClass("hidden");
            angular.element(document.getElementsByClassName("keypad")).removeClass("hidden");
            $scope.unlockText = $sce.trustAsHtml("Voer code in om alarm op <b>Afwezig</b> te zetten");   */
            
            if ($scope.service == '' || $scope.deviceId == '') {
                alert("Fout bij het ophalen van de status. Ververs de app eerst.");
                return;
            }
            
            $http.get($scope.vera_command_url + "id=lu_action&output_format=json&DeviceNum=" + $scope.deviceId + "&serviceId=" + $scope.service + "&action=RequestArmMode&State=Armed&PINCode=").then(function(response) {
                $scope.update();
            });           
        };
        
        $scope.disarm = function() {
            $scope.currentAction = 'disarm';
            angular.element(document.getElementsByClassName("lock-buttons")).addClass("hidden");
            angular.element(document.getElementsByClassName("lock-status")).addClass("hidden"); 
            angular.element(document.getElementsByClassName("code")).removeClass("hidden");
            angular.element(document.getElementsByClassName("keypad")).removeClass("hidden");
            $scope.unlockText = $sce.trustAsHtml("Voer code in om alarm <b>uit</b> te schakelen");
            $scope.isCodeEntering = true;              
        };
        
        $scope.gotoSettings = function() {
            $ionicHistory.nextViewOptions({
                disableBack: true
            });
            $state.go('app.settings');            
        };
    });
