import * as go from 'gojs';
import { ReactDiagram } from 'gojs-react';
import * as React from 'react';
import GuidedDraggingTool  from './GuidedDraggingTool';

interface DiagramProps {
  model: Array<go.ObjectData>;
  modelData: go.ObjectData;
  skipsDiagramUpdate: boolean;
  onDiagramEvent: (e: go.DiagramEvent) => void;
  onModelChange: (e: go.IncrementalData) => void;
  nodeDataArray: Array<go.ObjectData>,
  linkDataArray: Array<go.ObjectData>
}

export default class DiagramWrapper extends React.Component<DiagramProps, {}> {
  /**
   * Ref to keep a reference to the Diagram component, which provides access to the GoJS diagram via getDiagram().
   */
  private diagramRef: React.RefObject<ReactDiagram>;

  /** @internal */
  constructor(props: DiagramProps) {
    super(props);
    this.diagramRef = React.createRef();
  }

  /**
   * Get the diagram reference and add any desired diagram listeners.
   * Typically the same function will be used for each listener, with the function using a switch statement to handle the events.
   */
  public componentDidMount() {
    if (!this.diagramRef.current) return;
    const diagram = this.diagramRef.current.getDiagram();
    if (diagram instanceof go.Diagram) {
      diagram.addDiagramListener('ChangedSelection', this.props.onDiagramEvent);
    }
  }

  /**
   * Get the diagram reference and remove listeners that were added during mounting.
   */
  public componentWillUnmount() {
    if (!this.diagramRef.current) return;
    const diagram = this.diagramRef.current.getDiagram();
    if (diagram instanceof go.Diagram) {
      diagram.removeDiagramListener('ChangedSelection', this.props.onDiagramEvent);
    }
  }

  // description of the diagram in GO-JS
  private initDiagram(): go.Diagram {
    const $ = go.GraphObject.make;
    const diagram =
      $(go.Diagram,
        {
          'undoManager.isEnabled': true,  // must be set to allow for model change listening
          // 'undoManager.maxHistoryLength': 0,  // uncomment disable undo/redo functionality
          'clickCreatingTool.archetypeNodeData': { name: 'new node', color: 'lightblue' },
          draggingTool: new GuidedDraggingTool(),  // defined in GuidedDraggingTool.ts
          'draggingTool.horizontalGuidelineColor': 'blue',
          'draggingTool.verticalGuidelineColor': 'blue',
          'draggingTool.centerGuidelineColor': 'green',
          'draggingTool.guidelineWidth': 1,
          layout: $(go.TreeLayout,{
            angle: 90,
            path: go.TreeLayout.PathSource,  // links go from child to parent
            setsPortSpot: false,  // keep Spot.AllSides for link connection spot
            setsChildPortSpot: false,  // keep Spot.AllSides
            // nodes not connected by "generalization" links are laid out horizontally
            arrangement: go.TreeLayout.ArrangementHorizontal
          }),
          model: $(go.GraphLinksModel,
            {
              linkKeyProperty: 'key',  // IMPORTANT! must be defined for merges and data sync when using GraphLinksModel
              // positive keys for nodes
              // makeUniqueKeyFunction: (m: go.Model, data: any) => {
              //   let k = data.key || 1;
              //   while (m.findNodeDataForKey(k)) k++;
              //   data.key = k;
              //   return k;
              // },
              // // negative keys for links
              // makeUniqueLinkKeyFunction: (m: go.GraphLinksModel, data: any) => {
              //   let k = data.key || -1;
              //   while (m.findLinkDataForKey(k)) k--;
              //   data.key = k;
              //   return k;
              // }
            })
        });

    // define a simple Node template
    diagram.nodeTemplate =
      $(go.Node, 'Auto',  // the Shape will go around the TextBlock
        new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
        $(go.Shape, 'RoundedRectangle',
          {
            name: 'SHAPE', fill: 'lightyellow', strokeWidth: 0,
            // set the port properties:
            portId: '', fromLinkable: true, toLinkable: true, cursor: 'pointer'
          },
          // Shape.fill is bound to Node.data.color
          new go.Binding('fill', 'lightyellow')),
        $(go.Panel, 'Table', {defaultRowSeparatorStroke:'black'},
         //header
         $(go.TextBlock, 
          { margin: 8, editable: true, font: '400 .875rem Roboto, sans-serif' },  // some room around the text
            new go.Binding('text',"'modelFiles['concerto.metamodel'].declarations.name'").makeTwoWay()
          ),
          //props
          $(go.TextBlock, "Properties",
                  { row: 1, font: "italic 10pt sans-serif" },
                  new go.Binding("visible", "visible", function (v) { return !v; }).ofObject("PROPERTIES")),
                $(go.Panel, "Vertical", { name: "PROPERTIES" },
                  new go.Binding("itemArray", "properties").makeTwoWay(),
                  {
                    row: 1, margin: 3, defaultAlignment: go.Spot.TopRight, visible: false
                  }
                ),
                $("PanelExpanderButton", "PROPERTIES",
                  { row: 1, margin: 3,column: 1, defaultAlignment: go.Spot.TopRight, visible: false},
                  new go.Binding("visible", "properties", function (arr) {
                    return arr.length > 0; })),
      ));

    // relinking depends on modelData
    diagram.linkTemplate =
      $(go.Link,
        new go.Binding('relinkableFrom', 'canRelink').ofModel(),
        new go.Binding('relinkableTo', 'canRelink').ofModel(),
        $(go.Shape),
        $(go.Shape, { toArrow: 'Standard' })
      );

    return diagram;
  }

  public render() {
    return (
      <ReactDiagram
        ref={this.diagramRef}
        divClassName='diagram-component'
        initDiagram={this.initDiagram}
        nodeDataArray={this.props.model}
        modelData={this.props.modelData}
        onModelChange={this.props.onModelChange}
        skipsDiagramUpdate={this.props.skipsDiagramUpdate}
      />
    );
  }
}
