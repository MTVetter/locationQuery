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
  "esri/geometry/geometryEngine",
  "esri/renderers/UniqueValueRenderer"
], function(SketchViewModel, Map, FeatureLayer, GraphicsLayer, MapView, Graphic, Expand, watchUtils, LayerList, Home, geometryEngine, UniqueValueRenderer) {
  
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
  /*Create Renderer for the Hexagons *****/
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

  var countyRenderer = {
      type: "simple",
      symbol: {
          type: "simple-fill",
          color: [0,0,0,0],
          outline: {
              color: [50,50,50, 0.5],
              width: 0.75
          }
      }
  };

  var cdRenderer = {
      type: "unique-value",
      field: "CD115FP",
      uniqueValueInfos: [{
          value: "02",
          symbol: {
              type: "simple-fill",
              color: [191,151,39, 0.5],
              outline: {
                  width: 0.2,
                  color: "black"
              }
          }
      },{
          value: "07",
          symbol: {
              type: "simple-fill",
              color: [96,113,0, 0.5],
              outline: {
                  width: 0.2,
                  color: "black"
              }
          }
      },{
          value: "08",
          symbol: {
              type: "simple-fill",
              color: [0,115,76, 0.5],
              outline: {
                  width: 0.2,
                  color: "black"
              }
          }
      },{
          value: "09",
          symbol: {
              type: "simple-fill",
              color: [112,68,137, 0.5],
              outline: {
                  width: 0.2,
                  color: "black"
              }
          }
      },{
          value: "10",
          symbol: {
              type: "simple-fill",
              color: [1,172,202, 0.5],
              outline: {
                  width: 0.2,
                  color: "black"
              }
          }
      },{
          value: "14",
          symbol: {
              type: "simple-fill",
              color: [2,78,118, 0.5],
              outline: {
                  width: 0.2,
                  color: "black"
              }
          }
      },{
        value: "18",
        symbol: {
            type: "simple-fill",
            color: [240,145,0, 0.5],
            outline: {
                width: 0.2,
                color: "black"
            }
        }
      },{
        value: "22",
        symbol: {
            type: "simple-fill",
            color: [234,49,31, 0.5],
            outline: {
                width: 0.2,
                color: "black"
            }
        }
      },{
        value: "29",
        symbol: {
            type: "simple-fill",
            color: [117,112,179, 0.5],
            outline: {
                width: 0.2,
                color: "black"
            }
        }
      },{
        value: "36",
        symbol: {
            type: "simple-fill",
            color: [128,128,128, 0.5],
            outline: {
                width: 0.2,
                color: "black"
            }
        }
      }]
  }

  /***************************************/
  /*** Create Popup for the Counties *****/
  /***************************************/
  var countyPopup = {
      title: "{Name}",
      content: "Below are two URLs that display the workers from {Name}.<br><br/>Workers living in <a href='https://public.tableau.com/views/Commuting_Patterns_Query/Summary?:display_count=y&:showShareOptions=true&:display_count=no&:showVizHome=no&CO_GEOID_h={FIPS}' target='_blank'>{NAME}</a><br><br/>Workers working in <a href='https://public.tableau.com/views/Commuting_Patterns_Query/Summary?:display_count=y&:showShareOptions=true&:display_count=no&:showVizHome=no&CO_GEOID_w={FIPS}' target='_blank'>{NAME}</a><br/><br/>Workers living and working in <a href='https://public.tableau.com/views/Commuting_Patterns_Query/Summary?:display_count=y&:showShareOptions=true&:display_count=no&:showVizHome=no&CO_GEOID_h={FIPS}&CO_GEOID_w={FIPS}' target='_blank'>{NAME}</a>"
  };

  var placePopup = {
      title: "{Name}",
      content: "Below are two URLs that display the workers from {Name}.<br><br/>Workers living in <a href='https://public.tableau.com/views/Commuting_Patterns_Query/Summary?:display_count=y&:showShareOptions=true&:display_count=no&:showVizHome=no&Pl_GEOID_h={FIPS}' target='_blank'>{Name}</a><br><br/>Workers working in <a href='https://public.tableau.com/views/Commuting_Patterns_Query/Summary?:display_count=y&:showShareOptions=true&:display_count=no&:showVizHome=no&Pl_GEOID_w={FIPS}' target='_blank'>{Name}</a><br><br/>Workers living and working in <a href='https://public.tableau.com/views/Commuting_Patterns_Query/Summary?:display_count=y&:showShareOptions=true&:display_count=no&:showVizHome=no&Pl_GEOID_h={FIPS}&Pl_GEOID_w={FIPS}' target='_blank'>{Name}</a>"
  };

  var congDistrictPopup = {
      title: "Congressional District {CD115FP}",
      content: "Below are two URLs that display the workers from Congressional District {CD115FP}. The Congressional Districts are based on H-GAC's 8 county boundary.<br><br/>Workers living in <a href='https://public.tableau.com/views/Commuting_Patterns_Query/Summary?:display_count=y&:showShareOptions=true&:display_count=no&:showVizHome=no&CD_ID_h={CD115FP}' target='_blank'>Congressional District {CD115FP}</a><br><br/>Workers working in <a href='https://public.tableau.com/views/Commuting_Patterns_Query/Summary?:display_count=y&:showShareOptions=true&:display_count=no&:showVizHome=no&CD_ID_w={CD115FP}' target='_blank'>Congressional District {CD115FP}</a><br><br/>Workers living and working in <a href='https://public.tableau.com/views/Commuting_Patterns_Query/Summary?:display_count=y&:showShareOptions=true&:display_count=no&:showVizHome=no&CD_ID_h={CD115FP}&CD_ID_w={CD115FP}' target='_blank'>Congressional District {CD115FP}</a>"
  }

  var hex = new FeatureLayer({
      url: 'https://gis.h-gac.com/arcgis/rest/services/Forecast/H3M/MapServer/0',
      title: '3 Sq. Mile Hexagons',
      renderer: hexRenderer,
      legendEnabled: false
  });

  var places = new FeatureLayer({
      url: "https://gis.h-gac.com/arcgis/rest/services/Census_ACS/Census_ACS_5Yr_Places/MapServer/0",
      title: "Places",
      definitionExpression: "FIPS IN('4840588', '4803264', '4827420', '4846500', '4836092', '4815652', '4818260', '4802272', '4805288', '4809388', '4833980', '4816432', '4869548', '4860164', '4871384', '4871492', '4834220', '4841116', '4841980', '4865726', '4865345', '4877746', '4849128', '4873316', '4876948', '4856000', '4803072', '4832240', '4806128', '4806200', '4872392', '4833200', '4856108', '4857615', '4859336', '4838776', '4872989', '4820344', '4810090', '4865372', '4866392', '4803144', '4817336', '4849068', '4853824', '4869830', '4871960', '4877956', '4869908', '4835348', '4856156', '4863044', '4867400', '4827996', '4833068', '4835480', '4818476', '4849380', '4869020', '4861892', '4863284', '4870808', '4815436', '4819432', '4846056', '4803708', '4820140', '4879408', '4869932', '4842568', '4851984', '4848804', '4856348', '4838476', '4876228', '4810636', '4828068', '4827648', '4841440', '4835000', '4807300', '4819624', '4806272', '4827876', '4838848', '4850628', '4867964', '4872740', '4801696', '4804462', '4805180', '4805696', '4808240', '4809250', '4814236', '4814929', '4815628', '4817756', '4818134', '4827540', '4833836', '4835324', '4848772', '4856482', '4857596', '4858850', '4863332', '4865564', '4867766', '4869596', '4870520', '4872656','4879192', '4879792')",
      legendEnabled: false,
      visible: false,
      popupTemplate: placePopup
  });

  var counties = new FeatureLayer({
      url: "https://gis.h-gac.com/arcgis/rest/services/Census_ACS/Census_ACS_5Yr_Counties/MapServer/0",
      title: "Counties",
      definitionExpression: "Name IN('Waller County', 'Fort Bend County', 'Brazoria County', 'Montgomery County', 'Harris County', 'Galveston County', 'Liberty County', 'Chambers County')",
      visible: false,
      renderer: countyRenderer,
      outFields: ["Name", "FIPS"],
      popupTemplate: countyPopup
  });

  var congDistricts = new FeatureLayer({
      url: "https://gis.h-gac.com/arcgis/rest/services/Census_ACS/Census_Congressional_District_2017/MapServer/0",
      title: "Congressional Districts",
      definitionExpression: "CD115FP NOT IN('27')",
      visible: false,
      outFields: ["CD115FP"],
      renderer: cdRenderer,
      popupTemplate: congDistrictPopup
  });
  
  /**********************************/
  /*Create the map/view & add Layers*/
  /**********************************/
  const map = new Map({
      basemap: "streets-navigation-vector",
      layers: [layer, counties, congDistricts, places, hex, homeGraphicLayer, workGraphicLayer]
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
                  if (test[1].hexID !== "4567"){
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
});

