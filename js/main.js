/* Main JavaScript sheet for H-GAC Transportation Comments */
$(document).ready(function (){

  //Create the basics for the ESRI portion of the application
  require([
    "esri/Map",
    "esri/views/MapView",
    "esri/widgets/Home",
    'esri/widgets/Expand',
    'esri/layers/FeatureLayer',
    'esri/Graphic',
    'esri/views/draw/Draw',
    'esri/views/draw/PointDrawAction',
    'esri/widgets/Legend',
    'esri/widgets/Sketch',
    'esri/layers/GraphicsLayer',
    'esri/widgets/LayerList',
    'esri/core/watchUtils',
    "esri/request",
    "esri/tasks/support/Query"
  ], function(
    Map,
    MapView,
    Home,
    Expand,
    FeatureLayer,
    Graphic,
    Draw,
    PointDrawAction,
    Legend,
    Sketch,
    GraphicsLayer,
    LayerList,
    watchUtils,
    esriRequest,
    Query
  ) {

    //*********************************/
    //        Global Variables
    //**********************************/
    var editFeature, highlight;
    var submitBtn = document.getElementById('submitbtn');
    var addFeatureDiv = document.getElementById('addFeatureDiv');
    var attributeEditing = document.getElementById('featureUpdateDiv');
    var newProject, graphic, draw, lineGraphic, polyGraphic;
    var dropdown = $('#cType');
    var errors = 0;
    var clickedButton = 0;
  
    //*********************************/
    //Create the basemap and the widgets
    //*********************************/

    //Create the map
    var map = new Map({
      basemap: "streets-navigation-vector"
    });
  
    //Add the view
    var view = new MapView({
      map: map,
      container: "viewDiv",
      center: [-95.444, 29.756],
      zoom: 8
    });
  
    //Add a Home button
    var homeWidget = new Home({
      view: view
    });
    view.ui.add(homeWidget, "top-left");
    
    //Add the poly button
    view.ui.add("line-button", "top-left");

    //Create and add the draw point button
    view.when(function(event){
      draw = new Draw({
        view: view
      });

      //*********************************************/
      //Create action when editing button is clicked
      //*********************************************/
      var editButton = document.getElementById('line-button');
      editButton.onclick = function(){
        //$('#panel').show('slide');
        view.graphics.removeAll();
        enableCreatePoly(draw, view);
      }
    });
  
    //*********************************/
    //  Add the layers to the map
    //*********************************/
    var countyRenderer = {
      type: 'simple',
      symbol: {
        type: 'simple-fill',
        color: [0,0,0,0],
        outline: {
          color: [50,50,50, 0.7],
          width: 0.5
        }
      }
    };
    
    var county = new FeatureLayer({
      url: 'https://gis.h-gac.com/arcgis/rest/services/Census_ACS/Census_ACS_5Yr_Tracts/MapServer/0',
      title: 'Census Tracts',
      renderer: countyRenderer,
      legendEnabled: false
    });
    map.add(county);

    var gl = new GraphicsLayer();
    map.add(gl);

    //***********************************************/
    // Functions to add poly to the map after drawing
    //***********************************************/
    function enableCreatePoly(draw, view){
      var action = draw.create('polygon');

      //Give a visual feedback to the user
      action.on('vertex-add', function(evt){
        createPolyGraphic(evt.vertices);
      });
      action.on('vertex-remove', function(evt){
        createPolyGraphic(evt.vertices);
      });
      action.on('cursor-update', function(evt){
        createPolyGraphic(evt.vertices)
      });

      //Create the point when the user clicks on the view
      action.on('draw-complete', addPolyAttributes);
    }

    //Create a new graphic presenting the polygon that is being drawn
    function createPolyGraphic(vertices){
      view.graphics.removeAll();

      //Graphic representing the polygon
      var polygon = {
        type: 'polygon',
        rings: vertices,
        spatialReference: view.spatialReference
      };

      //Symbology for the graphic while its being drawn by the user
      polyGraphic = new Graphic({
        geometry: polygon,
        symbol: {
          type: 'simple-fill',
          color: [204, 153, 255, 0.5],
          style: 'solid',
          outline: {
            color: [115, 115, 115, 0.8],
            width: 1
          }
        }
      });

      //Add the graphic to the view
      view.graphics.add(polyGraphic);
    }

    //Add attributes to the line graphic
    function addPolyAttributes(event){
      createPolyGraphic(event.vertices);
      var lastPath = [event.vertices["0"]];
      var paths = event.vertices.concat(lastPath);
      addFeature = graphic;

      //New graphic polygon with attributes
      var newPolygon = {
        type: 'polygon',
        rings: paths,
        spatialReference: view.spatialReference
      };

      //Query the Census Tracts layer based on the drawn polygon's geometry
      //Show get the Tract ID for features that intersect with the drawn polygon
      var query = county.createQuery();
      query.geometry = newPolygon;
      query.spatialRelationship = "intersects";
      query.outFields = ["Tract"];

      //Create a string to hold the Census Tract ID's
      var tractID = "";

      //Query the Census Tracts using the query requirements from above
      county.queryFeatures(query)
        .then(function(response){
          //Loop through all the results
          for (var i = 0; i < response.features.length; i++){
            //Add the resulting Tract ID to the string
            tractID += response.features[i].attributes.Tract + ",";
          }

          //Remove the comma at the end of the string
          var finalTracts = tractID.slice(0, tractID.length - 1);
          console.log(finalTracts);

          //Create attributes for the graphic
          //These attributes are the URLs for the tableau page
          var tractPopup = {
            "censusTracts": finalTracts,
            "homeURL": "https://public.tableau.com/views/CommutePatterns_Tracts/CommutePattern?:display_count=y&&:showVizHome=no&Home=" + finalTracts,
            "workURL": "https://public.tableau.com/views/CommutePatterns_Tracts/CommutePattern?:display_count=y&&:showVizHome=no&Workplace=" + finalTracts
          };

          //Give the graphic a symbology so that its not black when the user draws another graphic
          var polySymbol = {
            type: "simple-fill",
            color: [204, 153, 255, 0.5],
            style: "solid",
            outline: {
              color: [115, 115, 115, 0.8],
              width: 1
            }
          };
          
          //Create the graphic using the derived information
          newProject = new Graphic({
            geometry: newPolygon,
            attributes: tractPopup,
            symbol: polySymbol
          });

          //Give the graphic a popup template so that the user can get access to the URLs
          newProject.popupTemplate = {
            title: "Census Tract Results",
            content: "View the Census Tracts where most of the people from the area you drew work, click on the link below:<br/><br/><a href={homeURL} target='_blank'>Commuting Patterns from Home</a><br/><br/><a href={workURL} target='_blank'>Commuting Patterns from Work</a>"
          }

          //Add the graphic to the graphics layer which will store all user drawn graphics until the user leaves the application
          gl.add(newProject);
        });

      //console.log(JSON.stringify(newProject));
    }

    //*********************************/
    //  Hide the editing panel
    //*********************************/
    $('#closebutton').on('click', function(){
      cancel();
      clickedButton = 0;
    });

    function cancel(){
      view.graphics.removeAll();
      draw.reset();
      $('#panel').hide();
      clearFields();
    }

    //*********************************/
    //  Add action to Help button
    //*********************************/
    $('#helpbtn').click(function(){
      helpDialog.dialog('open');
    });

    //Testing of the hitTest
    view.on("click", function(event){
      view.hitTest(event).then(function(response){
        if (response.results.length){
          var graphic = response.results.filter(function(result){
            return result.graphic.layer === gl;
          })[0].graphic;

          console.log(graphic.attributes);
        }
      });
    });

    
    
  });
})

