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

    .controller('PlaylistsCtrl', function($scope) {
        $scope.playlists = [
            {title: 'Reggae', id: 1},
            {title: 'Chill', id: 2},
            {title: 'Dubstep', id: 3},
            {title: 'Indie', id: 4},
            {title: 'Rap', id: 5},
            {title: 'Cowbell', id: 6}
        ];
    })

    .controller('PlaylistCtrl', function($scope, $stateParams) {
    })

    .controller('HomeCtrl', function($scope, $timeout) {
        var origBackElem = angular.element(document.querySelector("ion-nav-bar > div.nav-bar-block[nav-bar='active'] > ion-header-bar button.ion-navicon"));
        
        $scope.atChar = 1;
        $scope.code = "";
        
        $scope.$on("$ionicView.enter", function(scopes, states) {
            origBackElem.css('opacity', 0);
            ionic.Platform.ready(function(){
                if (window.StatusBar) StatusBar.styleBlackOpaque();
            });
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
            }, 100);
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
        }
    });
