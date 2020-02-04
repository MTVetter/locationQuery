/* Main JavaScript sheet for Custom Commute Pattern Boundaries */
require([
    "esri/widgets/Sketch/SketchViewModel",
    "esri/Map",
    "esri/layers/FeatureLayer",
    "esri/layers/GraphicsLayer",
    "esri/views/MapView",
    "esri/Graphic",
    "esri/widgets/Expand",
    "esri/core/watchUtils"
], function(SketchViewModel, Map, FeatureLayer, GraphicsLayer, MapView, Graphic, Expand, watchUtils) {
    
    /**********************************/
    /*Variables for the Graphics Layer*/
    /**********************************/
    const layer = new GraphicsLayer();
    const homeGraphicLayer = new GraphicsLayer();
    const workGraphicLayer = new GraphicsLayer();

    /***************************************/
    /*Create Renderer for the Census Tracts*/
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

    var hex = new FeatureLayer({
        url: 'https://gis.h-gac.com/arcgis/rest/services/Forecast/H3M/MapServer/0',
        title: '3 Sq. Mile Hexagons',
        renderer: hexRenderer,
        legendEnabled: false
    });
    
    /**********************************/
    /*Create the map/view & add Layers*/
    /**********************************/
    const map = new Map({
        basemap: "streets-navigation-vector",
        layers: [layer, hex, homeGraphicLayer, workGraphicLayer]
    });

    const view = new MapView({
        map: map,
        container: "viewDiv",
        center: [-95.444, 29.756],
        zoom: 8
    });

    //JavaScript Object that holds the final Census Tract
    //information for both the Home and Work polygons
    var test = [
        {type: "Home", hexID:0123},
        {type: "Work", hexID:4567}
    ];

    /******************************/
    /*Add the simple Sketch Widget*/
    /******************************/
    const sketchHome = new SketchViewModel({
        layer: layer,
        view: view
    });

    sketchHome.on("create", function(event){
        //When the sketch state is considered complete
        if (event.state === "complete"){
            //Query the Census Tracts based on the drawn geometry
            var query = hex.createQuery();
            query.geometry = event.graphic.geometry;
            query.outFields = ["ID"];

            var hexID = "";
            hex.queryFeatures(query)
                .then(function(response){
                    //Loop through all the Census Tracts and
                    //Add the Hex number and a comma to the string
                    for (var i = 0; i < response.features.length; i++){
                        hexID += response.features[i].attributes.ID + ",";
                    }

                    //Once all the Tract number are stored, remove the trailing comma
                    var finalHex = hexID.slice(0, hexID.length - 1);
                    console.log(finalHex);

                    //Create attributes for the graphic
                    var hexAtts = {
                        "hexID": finalHex,
                        "type": "home"
                    };

                    //Create a renderer for the graphic
                    var polySymbol = {
                        type: "simple-fill",
                        color: [250, 224, 60, 0.65],
                        style: "solid",
                        outline: {
                            color: [250, 224, 60, 1],
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
                    homeGraphicLayer.add(newGraphic);
                    layer.removeAll();

                    //Add the data to the URL
                    updateFinalURL("Home", finalHex);

                    //Update the anchor element with a custom URL
                    var aTag = document.getElementById("homeTracts");
                    aTag.setAttribute("href", "https://public.tableau.com/views/hex_3m_LEHD/CommutePattern?:display_count=y&&:showVizHome=no&Home=" + finalHex);
                    aTag.innerText = "View Home Commute Patterns";
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
        layer.removeAll();
        homeGraphicLayer.removeAll();
    };

    /*******************************/
    /*Repeat previous lines of code*/
    /*******************************/
    const sketchWork = new SketchViewModel({
        layer: layer,
        view: view
    });

    sketchWork.on("create", function(event){
        if (event.state === "complete"){
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
                    console.log(finalHex);

                    var tractAtts = {
                        "censusTracts": finalHex,
                        "type": "work"
                    };

                    var polySymbol = {
                        type: "simple-fill",
                        color: [111, 159, 216, 0.65],
                        style: "solid",
                        outline: {
                            color: [111, 159, 216, 1],
                            width: 2
                        }
                    };

                    var newGraphic = new Graphic({
                        geometry: event.graphic.geometry,
                        attributes: tractAtts,
                        symbol: polySymbol
                    });

                    workGraphicLayer.add(newGraphic);
                    layer.removeAll();

                    updateFinalURL("Work", finalHex);
    
                    var aTag = document.getElementById("workTracts");
                    aTag.setAttribute("href", "https://public.tableau.com/views/hex_3m_LEHD/CommutePattern?:display_count=y&&:showVizHome=no&Workplace=" + finalHex);
                    aTag.innerText = "View Work Commute Patterns";
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
        layer.removeAll();
        workGraphicLayer.removeAll();
    };

    /***********************************************/
    /*Create Expand widgets when the view is loaded*/
    /***********************************************/
    view.when(function(){
        var helpInfo = document.getElementById("helpInfo");
        var helpExpand = new Expand({
            expandIconClass: "esri-icon-notice-round",
            expandTooltip: "Application Help",
            view: view,
            content: helpInfo,
            expanded: true
        });
        view.ui.add(helpExpand, "top-left");

        var drawPolys = document.getElementById("drawPolys");
        var drawExpand = new Expand({
            expandIconClass: "esri-icon-edit",
            expandTooltip: "Draw Custom Polygons",
            view: view,
            content: drawPolys,
            expanded: false
        });
        view.ui.add(drawExpand, "top-left");

        var urlContent = document.getElementById("urlContent");
        var urlExpand = new Expand({
            expandIconClass: "esri-icon-link",
            expandTooltip: "Custom Commute Patterns",
            view: view,
            content: urlContent,
            expanded: false
        });
        view.ui.add(urlExpand, "top-left");

        //When the view is expanded, change the CSS display value
        //This is so that the div isn't displayed while the application loads
        watchUtils.whenTrueOnce(urlExpand, "expanded", function(){
            document.getElementById("urlContent").style.display = "block";
        });
    
        watchUtils.whenTrueOnce(drawExpand, "expanded", function(){
            document.getElementById("drawPolys").style.display = "block";
        });

        watchUtils.whenTrueOnce(helpExpand, "expanded", function(){
            document.getElementById("helpInfo").style.display = "block";
        });
    });

    /**************************************************/
    /*Create actions when the Select button is clicked*/
    /**************************************************/
    var linkButton = document.getElementById("finalURL");
    linkButton.onclick = function(){
        extendedLink();
    };

    //Function to update the final URL
    function updateFinalURL(type, hexID){
        //Loop through the objects
        for (var i = 0; i < test.length; i++){
            //If the object matches the type
            //Update the Tract numbers with the new Tract numbers
            if (test[i].type === type){
                test[i].hexID = hexID;
                break;
            }
        }
        
    };

    //When a user clicks a button, open a new tab to with the new custom URL
    function extendedLink(){
        window.open("https://public.tableau.com/views/hex_3m_LEHD/CommutePattern?:display_count=y&&:showVizHome=no&Home="+test[0].hexID+"&Workplace="+test[1].hexID);
    };
});