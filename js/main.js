$(function () {
  var light_style = [{"featureType":"landscape","stylers":[{"saturation":-100},{"lightness":65},{"visibility":"on"}]},{"featureType":"poi","stylers":[{"saturation":-100},{"lightness":51},{"visibility":"simplified"}]},{"featureType":"road.highway","stylers":[{"saturation":-100},{"visibility":"simplified"}]},{"featureType":"road.arterial","stylers":[{"saturation":-100},{"lightness":30},{"visibility":"on"}]},{"featureType":"road.local","stylers":[{"saturation":-100},{"lightness":40},{"visibility":"on"}]},{"featureType":"transit","stylers":[{"saturation":-100},{"visibility":"simplified"}]},{"featureType":"administrative.province","stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"labels","stylers":[{"visibility":"on"},{"lightness":-25},{"saturation":-100}]},{"featureType":"water","elementType":"geometry","stylers":[{"hue":"#ffff00"},{"lightness":-25},{"saturation":-97}]}];

  var map;
  var infowindow;
  var loadDataLayer = function(data, z_index, clickInfo, style_attribute, style_map) {
    var markers = [];
    var clickable = false;
    if (clickInfo !== null) {
      clickable = true;
    }

    var showInfoWindow = function() {
      var content = clickInfo(this.data);
      infowindow.close();
      infowindow.setContent(content);
      infowindow.open(map, this); 
    }; 

    for (var i in data) {
      var rec = data[i];
      var marker = new google.maps.Marker({
        position: new google.maps.LatLng(rec.latitude, rec.longitude),
        zIndex: z_index,
        clickable: clickable
      });
      
      if (style_attribute && style_map) {
        if (rec[style_attribute]) {
          var style_val = rec[style_attribute];
          if (style_map[style_val]) {
            if (style_map.size) {
              marker.setIcon({
                url: style_map[style_val],
                scaledSize: new google.maps.Size(style_map.size, style_map.size), // scaled size
                origin: new google.maps.Point(0,0), // origin
                anchor: new google.maps.Point(style_map.anchor[0],style_map.anchor[1]) 
              });
            } else {
              marker.setIcon(style_map[style_val]);
            }
          }
        }
      }    
      marker.data = rec;

      if (clickable) {
        marker.addListener('click', showInfoWindow); 
      }

      markers.push(marker);
    }
    
    var len = markers.length;
    var setMap = function(m, filterFn) {
      for (var i = 0; i < len; i++) {
        if (filterFn) {
          if (filterFn(markers[i].data)) {
            markers[i].setMap(m);
          } else {
            markers[i].setMap(null);
          }
        } else {
          markers[i].setMap(m); 
        }
      }
    };

    return {
      show: function() {
        setMap(map);
      },
      hide: function() {
        setMap(null);
      },
      filter: function(fn) {
        setMap(map, fn);
      }
    };
  };

  var initMap = function() {
    var mapCanvas = document.getElementById('map');
    var mapOptions = {
      center: new google.maps.LatLng(35.16899709632771, -89.85338676720858),
      zoom: 10,
      panControl: false,
      streetViewControl: false,
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
        position: google.maps.ControlPosition.RIGHT_TOP,
        mapTypeIds: [ 
          google.maps.MapTypeId.ROADMAP,
          google.maps.MapTypeId.HYBRID,
          'style_light'
        ]
      }
    };
    map = new google.maps.Map(mapCanvas, mapOptions);
    var style = new google.maps.StyledMapType(light_style, {name:"Light"});
    map.mapTypes.set('style_light', style);
    map.setMapTypeId('style_light');

    var input = /** @type {!HTMLInputElement} */(document.getElementById('pac-input'));
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

    var autocomplete = new google.maps.places.Autocomplete(input);
            autocomplete.bindTo('bounds', map);

    var marker = new google.maps.Marker({map: map});
    infowindow = new google.maps.InfoWindow();
    var geocoder = new google.maps.Geocoder();
    autocomplete.addListener('place_changed', function() {
      marker.setVisible(false);
      var place = autocomplete.getPlace();
      if (!place.geometry) {
        geocoder.geocode({
          address: input.value
        }, function(result) {
          if (result.length > 0) {
            search_result(result[0]);        
          } else {
            alert("No results found.");
          }
        });
      } else {
        search_result(place);
      }
    });

    var search_result = function(result) {
      if (result.geometry.viewport) {
        map.fitBounds(result.geometry.viewport);
      } else {
        map.setCenter(result.geometry.location);
        map.setZoom(17); 
      }
      marker.setPosition(result.geometry.location);
      marker.setVisible(true);
    };
    
    var ps = loadDataLayer(
      pokestops, 
      999, 
      function(data) {
        var h = '<img src="' + data.image  + '" style="width: 100px; height:100px;"/>' +
                '<table class="table"><tbody>' +
                '<tr><td>Name</td><td>' + data.name  + '</td></tr>' +
                '</tbody></table>';
        return h;
      }, 
      'type', {'pokestop':'images/Pstop.png', 'pokestop_nodata': 'images/missing.gif','size': 10, 'anchor': [5,10]});
    $("#chk_pokestop").click(function() {
      if (this.checked) {
        ps.show();
      } else {
        ps.hide();
      }
    });

    var gym_layer = loadDataLayer(
      gyms, 
      1000, 
      function(data) {
        var h = '<img src="' + data.image  + '" style="width: 100px; height:100px;"/>' +
                '<table class="table"><tbody>' +
                '<tr><td>Name</td><td>' + data.name  + '</td></tr>' +
                //'<tr><td>Team</td><td>' + data.team  + '</td></tr>' +
                //'<tr><td>Points</td><td>' + data.points + '</td></tr>' +
                //'<tr><td>Level</td><td>' + data.level + '</td></tr>' +
                '</tbody></table>';
        return h;
      }, 
      'team', { 'Valor': 'images/instinct.png', 'Instinct': 'images/instinct.png', 'Mystic': 'images/instinct.png', 'None': 'images/instinct.png', 'size': 20, 'anchor': [10,20] });
    gym_layer.show();

    $("#instinct_gyms").html(gym_counts.Instinct);
    $("#mystic_gyms").html(gym_counts.Mystic);
    $("#valor_gyms").html(gym_counts.Valor);

    $("#instinct_gym_levels").html(average_gym_levels.Instinct);
    $("#mystic_gym_levels").html(average_gym_levels.Mystic);
    $("#valor_gym_levels").html(average_gym_levels.Valor);


    $("#last_updated").html("Last Updated:<br>" + last_updated);

    var i_check = $("#chk_instinct");
    var m_check = $("#chk_mystic");
    var v_check = $("#chk_valor");
    
    var toggle_gyms = function() {
      var teams = ['None']; //just always show these for now
      if (i_check.is(':checked')) {
        teams.push('Instinct');
      }

      if (m_check.is(':checked')) {
        teams.push('Mystic');
      }

      if (v_check.is(':checked')) {
        teams.push('Valor');
      }
     
      gym_layer.filter(function(data) {
        return teams.indexOf(data.team) != -1;
      });
    };
    i_check.click(toggle_gyms);
    m_check.click(toggle_gyms);
    v_check.click(toggle_gyms);

    var trainer_score = {};
    for (var g in gyms) {
      var gym = gyms[g];
      var gym_level = gym.level;
      if (gym.trainers) {
        var trainers = gym.trainers.reverse();
        for (var t in trainers) {
          var trainer = trainers[t];
          var score = gym_level - t; //mario-kart scoring, more points for higher position in gym, higher gyms net you more points
          if (!trainer_score[trainer.name]) {
            trainer_score[trainer.name] = {
              name: trainer.name,
              team: gym.team,
              level: trainer.level,
              total_cp: 0,
              avg_cp: 0,
              gyms: 0,
              points: 0
            };
          }
          trainer_score[trainer.name].gyms += 1;
          trainer_score[trainer.name].points += score;
          trainer_score[trainer.name].total_cp += trainer.pokemon_cp; 
          trainer_score[trainer.name].avg_cp = parseInt(trainer_score[trainer.name].total_cp / trainer_score[trainer.name].gyms, 10);
        }
      }        
    }
    var score_list = [];
    for (var k in trainer_score) {
      score_list.push(
        //trainer_score[k]
        [
          trainer_score[k].name,
          trainer_score[k].team,
          trainer_score[k].level,
          trainer_score[k].gyms,
          trainer_score[k].avg_cp,
          trainer_score[k].points
        ]
      );
    }
    score_list = score_list.sort(function(a,b) {
      return a[5] - b[5];
      //return a.points - b.points;
    }).reverse();
    var tops = {
      "Instinct": null,
      "Mystic": null,      
      "Valor": null
    };
    for (var s in score_list) {
      var team = score_list[s][1];
      //var team = score_list[s].team;
      if (tops[team] === null) {
        tops[team] = score_list[s];
      }
    }

    $('#example').DataTable( {
            data: score_list,
            columns: [
                { title: "Name" },
                { title: "Team" },
                { title: "Level" },
                { title: "Gyms" },
              //  { title: "Avg CP" },
              //  { title: "Score" }
            ],
            order:[[3, 'desc']],
            lengthMenu:[[15, 10, 25], [15,10,25]]
        } );

    //$("#instinct_trainers").html(tops.Instinct[0]);
    //$("#mystic_trainers").html(tops.Mystic[0]);
    //$("#valor_trainers").html(tops.Valor[0]);

  };
  google.maps.event.addDomListener(window, 'load', initMap);
});
