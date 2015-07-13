/*
 * Marcus Pham
 * July 12, 2015
 *
 * Search Spotify
 *
 * This webpage allows the user to search through
 * tracks and artists from the Spotify API. After
 * exploring music, the user can favorite tracks which
 * then appear on the homepage.
 *
 * Future: animations
 */

"use strict";

// Module Pattern to encapsulate variables
(function() {

    var data;
    var baseUrl = 'https://api.spotify.com/v1/search?type=track&query=';
    var myApp = angular.module('myApp', []);

    // Initialize cookie vars
    if (!document.cookie) {
        var heartsArray = [];
    } else {
        // cookie: "ids=[trackid]"
        var heartsArray = document.cookie.split('=')[1].split(',');
    }

    // Creates controller. Initializes vars and shows favorites on homepage
    var myCtrl = myApp.controller('myCtrl', function($scope, $http) {
        $scope.audioObject = {};
        $scope.minLength = 4;

        $('#favorites').hide();

        if (heartsArray.length > 0 && heartsArray[0] != "") {
            getTracks('https://api.spotify.com/v1/tracks/?ids=' + heartsArray);
            $('#favorites').show();
        } else {
            heartsArray = [];
        }

        // Gets Spotify tracks using the given url
        function getTracks(url) {
            $('#track-modal').modal('hide');

            $http.get(url).success(function(response) {
                data = $scope.tracks = response.tracks;
            });
            $('#favorites').hide();
        }

        // Searches for tracks with user input
        $scope.getSongs = function() {
            $http.get(baseUrl + $scope.track).success(function(response) {
                data = $scope.tracks = response.tracks.items;
            });
            $('#favorites').hide();
        };

        // Takes an Artist id and gets that artist's top tracks
        var getTopTracks = $scope.getTopTracks = function(id) {
            getTracks('https://api.spotify.com/v1/artists/' 
                + id + '/top-tracks?country=US');
        };

        // Takes an Album id and gets that album's tracks
        function getAlbumTracks(id) {
            $http.get('https://api.spotify.com/v1/albums/' 
                + id + '/tracks').success(function(response) {
                    // yields array of incomplete Track Objects
                    var albumData = response.items;

                    // Get full Track Objects from Track ids
                    var tracks = [];
                    albumData.map(function(d) {
                        tracks.push(d.id);
                    });
                    var trackIds = tracks.join(',');

                    getTracks('https://api.spotify.com/v1/tracks/?ids='
                        + trackIds);
            });

        };

        // Shows recommended tracks based on favorited tracks
        $scope.showRecommended = function() {
            var properties = [];

            var length = heartsArray.length;
            var randomFav = heartsArray[Math.floor(Math.random() * length)];

            var url = 'https://api.spotify.com/v1/tracks/' + randomFav;
            $http.get(url).success(function(response) {
                properties.push(response.name);
                properties.push(response.artists[0]);
                properties.push(response.album.name);

                var propLength = properties.length;
                var randomProp = properties[Math.floor(Math.random() * propLength)];

                $http.get(baseUrl + randomProp).success(function(response) {
                    data = $scope.tracks = response.tracks.items;
                });
            });

            $('#favorites h2').text('Recommendations');
            $('#recommended').hide();
        };

        // Takes a song and current track.
        // Handles playing audio and displays now-playing info
        // if a new song is selected
        $scope.play = function(song, track) {
            if ($scope.currentSong == song) {
                // Stop currently playing
                $scope.audioObject.pause();
                $scope.currentSong = false;
                return;
            } else {
                // New Song selected
                if ($scope.audioObject.pause != undefined)
                    $scope.audioObject.pause();
                $scope.audioObject = new Audio(song);
                $scope.audioObject.play();
                $scope.currentSong = song;
                showNowPlaying(track);
            }
        };

        // Handle content display of "Now-Playing" modal
        function showNowPlaying(track) {
            $('#song-name').text(track.name);

            var artists = [];
            var mainArtist = track.artists[0];

            // Get all artists of track
            track.artists.map(function(d) {
                artists.push(d.name);
                // Get most popular artist
                if (mainArtist.popularity < d.popularity) {
                    mainArtist = d;
                }
            });

            // Get related Artists to main artist
            var relatedEndPoint = 'https://api.spotify.com/v1/artists/' 
                + mainArtist.id + '/related-artists';
            $http.get(relatedEndPoint).success(function(response) {
                $scope.relatedArtists = response.artists;
            });
            var artistString = artists.join(', ');
            
            $('#artists').text('by ' + artistString);
            var artistTip = $scope.artistTip = 'Top tracks by ';

            // Makes artist name clickable if single artist
            if (artists.length == 1) {
                $('#artists').addClass('artist-link').attr('title', artistTip 
                    + track.artists[0].name).click(function() {

                        getTopTracks(track.artists[0].id);
                });
            }

            // Clicking on the album name retrieves that album's tracks
            $('#album-name').text(track.album.name).click(function() {
                getAlbumTracks(track.album.id);
            });

            $('#now-playing-img').attr('src', track.album.images[0].url);

            // Make sure the "favorites" checkbox is in the correct state
            // according to favorites list
            if (heartsArray.indexOf(track.id) > -1) {
                $('#heart').attr('checked', true);
            } else {
                $('#heart').attr('checked', false);
            }

            // Update cookie with favorites array
            $('#track-modal').one('hidden.bs.modal', function() {
                var id = track.id;
                var index = heartsArray.indexOf(id);
                if ($('#heart').is(':checked')) {
                    if (index == -1) {
                        heartsArray.push(id);
                    }
                } else {
                    if (index > -1) {
                        heartsArray.splice(index, 1);
                    }
                }
                document.cookie = "ids=" + heartsArray.join(',');
            });

            $('#track-modal').modal('show');
        }

    });

    // Add tool tips to anything with a title property
    $('body').tooltip({
        selector: '[title]'
    });

}) ();
