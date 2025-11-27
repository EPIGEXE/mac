declare module '@dagrejs/dagre' {
    export interface GraphLabel {
        rankdir?: 'TB' | 'BT' | 'LR' | 'RL';
        ranksep?: number;
        nodesep?: number;
    }

    export interface NodeConfig {
        width: number;
        height: number;
    }

    export interface NodeWithPosition {
        x: number;
        y: number;
        width: number;
        height: number;
    }

    export class Graph {
        setDefaultEdgeLabel(callback: () => unknown): Graph;
        setGraph(label: GraphLabel): Graph;
        setNode(name: string, config: NodeConfig): Graph;
        setEdge(source: string, target: string): Graph;
        node(name: string): NodeWithPosition;
        graph(): GraphLabel;
    }

    export namespace graphlib {
        class Graph {
            setDefaultEdgeLabel(callback: () => unknown): Graph;
            setGraph(label: GraphLabel): Graph;
            setNode(name: string, config: NodeConfig): Graph;
            setEdge(source: string, target: string): Graph;
            node(name: string): NodeWithPosition;
            graph(): GraphLabel;
        }
    }

    export function layout(graph: Graph | graphlib.Graph): void;

    const dagre: {
        graphlib: typeof graphlib;
        layout: typeof layout;
        Graph: typeof Graph;
    };

    export default dagre;
}
