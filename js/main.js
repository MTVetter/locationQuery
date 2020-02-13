/* Main JavaScript sheet for Custom Commute Pattern Boundaries */
require([
  "esri/widgets/Sketch/SketchViewModel",
  "esri/Map",
  "esri/layers/FeatureLayer",
  "esri/layers/GraphicsLayer",
  "esri/views/MapView",
  "esri/Graphic",
  "esri/widgets/Expand",
  "esri/core/watchUtils",
  "esri/widgets/LayerList",
  "esri/widgets/Home",
  "esri/geometry/geometryEngine"
], function(SketchViewModel, Map, FeatureLayer, GraphicsLayer, MapView, Graphic, Expand, watchUtils, LayerList, Home, geometryEngine) {
  
  /**********************************/
  /*Variables for the Graphics Layer*/
  /**********************************/
  const layer = new GraphicsLayer();
  layer.listMode = "hide";
  const homeGraphicLayer = new GraphicsLayer();
  homeGraphicLayer.listMode = "hide";
  const workGraphicLayer = new GraphicsLayer();
  workGraphicLayer.listMode = "hide";

  /***************************************/
  /*Create Renderer for theHexagons*/
  /***************************************/
  var hexRenderer = {
      type: 'simple',
      symbol: {
        type: 'simple-fill',
        color: [0,0,0,0],
        outline: {
          color: [50,50,50, 0.3],
          width: 0.5
        }
      }
  };

  var placeRenderer = {
      type: "simple",
      symbol: {
          type: "simple-fill",
          color: [0,0,0,0],
          outline: {
              color: [110, 110, 110, 0.7],
              width: 1
          }
      }
  };

  var hex = new FeatureLayer({
      url: 'https://gis.h-gac.com/arcgis/rest/services/Forecast/H3M/MapServer/0',
      title: '3 Sq. Mile Hexagons',
      renderer: hexRenderer,
      legendEnabled: false
  });

  var places = new FeatureLayer({
      url: "https://gis.h-gac.com/arcgis/rest/services/Census_ACS/Census_ACS_5Yr_Places/MapServer/0",
      title: "Places",
      legendEnabled: false,
      visible: false
  });

  var mud = new FeatureLayer({
      url: "https://gis.h-gac.com/arcgis/rest/services/LocationInformation/MUD_Relates/MapServer/0",
      title: "MUD",
      visible: false
  });
  
  /**********************************/
  /*Create the map/view & add Layers*/
  /**********************************/
  const map = new Map({
      basemap: "streets-navigation-vector",
      layers: [layer, places, mud, hex, homeGraphicLayer, workGraphicLayer]
  });

  const view = new MapView({
      map: map,
      container: "viewDiv",
      center: [-95.444, 29.756],
      zoom: 8
  });

  //JavaScript Object that holds the final Hexagon
  //information for both the Home and Work polygons
  var test = [
      {type: "Home", hexID:"0123"},
      {type: "Work", hexID:"4567"}
  ];

  /******************************/
  /*Add the simple Sketch Widget*/
  /******************************/
  const sketchHome = new SketchViewModel({
      layer: layer,
      view: view
  });

  sketchHome.on("create", function(event){
      //When the sketch state is considered active and the geometry is a circle
      if (event.state === "active" && event.tool === "circle"){
          //Remove all the graphics from the map
          view.graphics.removeAll();
          //Get the geodesic length to display the radius of the circle
          var lengText = (geometryEngine.geodesicLength(event.graphic.geometry, "miles")/6.2).toFixed(2) + " miles";
          //Create a graphic based on the sketch graphic
          var circleGraphic = new Graphic({
              geometry: event.graphic.geometry
          });
          //Create the text symbol for the graphic
          circleGraphic.symbol = {
              type: "text",
              color: "#000",
              haloColor: "#fff",
              haloSize: 2,
              text: lengText,
              font: {
                  family: "Montserrat",
                  size: 14,
                  weight: "normal"
              }
          };

          //Set the text attribute of the graphic
          circleGraphic.setAttribute(circleGraphic.symbol.text, lengText);
          //Add the graphic to the map to display the radius value
          view.graphics.add(circleGraphic);
      }

      //When the sketch state is considered complete
      if (event.state === "complete"){
          //Remove the radius value once the drawing has finished
          view.graphics.removeAll();
          
          //Query the Hexagons based on the drawn geometry
          var query = hex.createQuery();
          query.geometry = event.graphic.geometry;
          query.outFields = ["ID"];

          var hexID = "";
          hex.queryFeatures(query)
              .then(function(response){
                  //Loop through all the Hexagons and
                  //Add the Hex number and a comma to the string
                  for (var i = 0; i < response.features.length; i++){
                      hexID += response.features[i].attributes.ID + ",";
                  }

                  //Once all the Tract number are stored, remove the trailing comma
                  var finalHex = hexID.slice(0, hexID.length - 1);

                  //Create attributes for the graphic
                  var hexAtts = {
                      "hexID": finalHex,
                      "type": "home"
                  };

                  //Create a renderer for the graphic
                  var polySymbol = {
                      type: "simple-fill",
                      color: [255,0,0,0.4],
                      style: "solid",
                      outline: {
                          color: [255,0,0,1],
                          width: 1.5
                      }
                  };

                  //Create the new graphic
                  var newGraphic = new Graphic({
                      geometry: event.graphic.geometry,
                      attributes: hexAtts,
                      symbol: polySymbol
                  });

                  //Add newly created graphic to the home graphic layer
                  //Delete the extra graphic layer from the map
                  homeGraphicLayer.removeAll();
                  homeGraphicLayer.add(newGraphic);
                  layer.removeAll();

                  //Add the data to the URL
                  updateFinalURL("Home", finalHex);

                  //Update the anchor element with a custom URL
                  var aTag = document.getElementById("homeTracts");
                  aTag.setAttribute("href", "https://public.tableau.com/views/Commuting_Patterns_Query/Summary?:display_count=y&:showShareOptions=true&:display_count=no&:showVizHome=no&Home=" + finalHex);
                  aTag.innerText = "Home Commute Patterns";

                  //Check to see if the work polygon has been updated
                  //If the work attributes are different from the default
                  //Create the Home to Work Commute Pattern URL
                  if (test[1].hexID !== 4567){
                      var finalURLTag = document.getElementById("homeToWork");
                      finalURLTag.setAttribute("href", "https://public.tableau.com/views/Commuting_Patterns_Query/Summary?:display_count=y&:showShareOptions=true&:display_count=no&:showVizHome=no&Home="+test[0].hexID+"&Workplace="+test[1].hexID);
                      finalURLTag.innerText = "Home to Work Commute Patterns";
                  }
              })
      }
  });

  /********************************************/
  /*Create actions when user clicks on buttons*/
  /********************************************/
  var drawHomePolygonButton = document.getElementById("homePolygonButton");
  drawHomePolygonButton.onclick = function(){
      sketchHome.create("polygon");
  };

  var drawHomeRectangleButton = document.getElementById("homeRectangleButton");
  drawHomeRectangleButton.onclick = function(){
      sketchHome.create("rectangle");
  };

  var drawHomeCircleButton = document.getElementById("homeCircleButton");
  drawHomeCircleButton.onclick = function(){
      sketchHome.create("circle");
  };

  document.getElementById("homeResetBtn").onclick = function(){
      //Remove all graphics from the map
      layer.removeAll();
      homeGraphicLayer.removeAll();

      //Reset the hexID for the home polygon
      test[0].hexID = "0123";

      //Remove the URL that contains the home hexID
      document.getElementById("homeTracts").removeAttribute("href");
      document.getElementById("homeTracts").innerText = "";

      //If the home to work URL is visible
      //Remove it since the user is changing the home polygon
      if (document.getElementById("homeToWork").innerText){
          document.getElementById("homeToWork").removeAttribute("href");
          document.getElementById("homeToWork").innerText = "";
      };
  };

  /*******************************/
  /*Repeat previous lines of code*/
  /*******************************/
  const sketchWork = new SketchViewModel({
      layer: layer,
      view: view
  });

  sketchWork.on("create", function(event){
      if (event.state === "active" && event.tool === "circle"){
          //Remove all the graphics from the map
          view.graphics.removeAll();
          //Get the geodesic length to display the radius of the circle
          var lengText = (geometryEngine.geodesicLength(event.graphic.geometry, "miles")/6.2).toFixed(2) + " miles";
          //Create a graphic based on the sketch graphic
          var circleGraphic = new Graphic({
              geometry: event.graphic.geometry
          });
          //Create the text symbol for the graphic
          circleGraphic.symbol = {
              type: "text",
              color: "#000",
              haloColor: "#fff",
              haloSize: 2,
              text: lengText,
              font: {
                  family: "Montserrat",
                  size: 14,
                  weight: "normal"
              }
          };

          //Set the text attribute of the graphic
          circleGraphic.setAttribute(circleGraphic.symbol.text, lengText);
          //Add the graphic to the map to display the radius value
          view.graphics.add(circleGraphic);
      }

      if (event.state === "complete"){
          view.graphics.removeAll();
          var query = hex.createQuery();
          query.geometry = event.graphic.geometry;
          query.outFields = ["ID"];

          var hexID = "";
          hex.queryFeatures(query)
              .then(function(response){
                  for (var i = 0; i < response.features.length; i++){
                      hexID += response.features[i].attributes.ID + ",";
                  }

                  var finalHex = hexID.slice(0, hexID.length - 1);

                  var tractAtts = {
                      "censusTracts": finalHex,
                      "type": "work"
                  };

                  var polySymbol = {
                      type: "simple-fill",
                      color: [17, 142, 170, 0.4],
                      style: "solid",
                      outline: {
                          color: [17, 142, 170, 1],
                          width: 2
                      }
                  };

                  var newGraphic = new Graphic({
                      geometry: event.graphic.geometry,
                      attributes: tractAtts,
                      symbol: polySymbol
                  });

                  workGraphicLayer.removeAll();
                  workGraphicLayer.add(newGraphic);
                  layer.removeAll();

                  updateFinalURL("Work", finalHex);
  
                  var aTag = document.getElementById("workTracts");
                  aTag.setAttribute("href", "https://public.tableau.com/views/Commuting_Patterns_Query/Summary?:display_count=y&:showShareOptions=true&:display_count=no&:showVizHome=no&Workplace=" + finalHex);
                  aTag.innerText = "Work Commute Patterns";

                  if (test[0].hexID !== "0123"){
                      var finalURLTag = document.getElementById("homeToWork");
                      finalURLTag.setAttribute("href", "https://public.tableau.com/views/Commuting_Patterns_Query/Summary?:display_count=y&:showShareOptions=true&:display_count=no&:showVizHome=no&Home="+test[0].hexID+"&Workplace="+test[1].hexID);
                      finalURLTag.innerText = "Home to Work Commute Patterns";
                  }
              })
      }
  });

  var drawWorkPolygonButton = document.getElementById("workPolygonButton");
  drawWorkPolygonButton.onclick = function(){
      sketchWork.create("polygon");
  };

  var drawWorkRectangleButton = document.getElementById("workRectangleButton");
  drawWorkRectangleButton.onclick = function(){
      sketchWork.create("rectangle");
  };

  var drawWorkCircleButton = document.getElementById("workCircleButton");
  drawWorkCircleButton.onclick = function(){
      sketchWork.create("circle");
  };

  document.getElementById("workResetBtn").onclick = function(){
      //Remove all graphics from map
      layer.removeAll();
      workGraphicLayer.removeAll();

      //Reset the hexID for the work polygon
      test[1].hexID = "4567";

      //Remove the URL that contains the work hexID
      document.getElementById("workTracts").removeAttribute("href");
      document.getElementById("workTracts").innerText = "";

      //If the home to work URL is visible
      //Remove it since the user is changing the work polygon
      if (document.getElementById("homeToWork").innerText){
          document.getElementById("homeToWork").removeAttribute("href");
          document.getElementById("homeToWork").innerText = "";
      };

  };

  /***********************************************/
  /*Create Expand widgets when the view is loaded*/
  /***********************************************/
  view.when(function(){
      var homeWidget = new Home({
          view: view
      });
      view.ui.add(homeWidget, "top-left");

      //Add a LayerList to the application
      var layerList = new Expand({
          expandIconClass: "esri-icon-layer-list",
          view: view,
          content: new LayerList({
              view: view
          }),
          expanded: false
      });
      view.ui.add(layerList, "top-left");
  });

  //Function to update the final URL
  function updateFinalURL(type, hexID){
      //Loop through the objects
      for (var i = 0; i < test.length; i++){
          //If the object matches the type
          //Update the Hexagon numbers with the new Hexagon numbers
          if (test[i].type === type){
              test[i].hexID = hexID;
              break;
          }
      }
      
  };

  if (view.widthBreakpoint === "small" || view.widthBreakpoint === "xsmall"){
      updateView(true);
  };

  //Determine the user's screen size
  view.watch("widthBreakpoint", function(breakpoint){
      switch(breakpoint){
          case "xsmall":
          case "small":
              updateView(true);
              break;
          case "medium":
          case "large":
          case "xlarge":
              updateView(false);
              break;
          default:
      }
  });

  function updateView(mobile){
      if (mobile){
          urlContent.style.width = "331px";
          helpExpand.expanded = false;
      } else{
          helpExpand.expanded = true;
      }
  }
});

