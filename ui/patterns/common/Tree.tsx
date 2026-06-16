import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { Column, Row } from '@ui/layout';
import { Text } from '@ui/atoms';

export interface TreeNode<T = unknown> {
  id: string;
  label: ReactNode;
  children?: Array<TreeNode<T>>;
  data?: T;
}

interface TreeProps<T = unknown> {
  nodes: Array<TreeNode<T>>;
  renderNode?: (node: TreeNode<T>) => ReactNode;
  defaultExpanded?: string[];
  className?: string;
}

function TreeBranch<T>({ node, renderNode, defaultExpanded }: {
  node: TreeNode<T>;
  renderNode?: (node: TreeNode<T>) => ReactNode;
  defaultExpanded: Set<string>;
}) {
  const hasChildren = Boolean(node.children?.length);

  if (!hasChildren) {
    return (
      <li className="tree-leaf">
        <Text size="detail">{renderNode ? renderNode(node) : node.label}</Text>
      </li>
    );
  }

  return (
    <li>
      <details className="tree-branch" open={defaultExpanded.has(node.id)}>
        <summary>
          <Row align="center" gap={1}>
            <ChevronRight size={14} aria-hidden="true" />
            <Text size="detail">{renderNode ? renderNode(node) : node.label}</Text>
          </Row>
        </summary>
        <TreeList nodes={node.children ?? []} renderNode={renderNode} defaultExpanded={defaultExpanded} />
      </details>
    </li>
  );
}

function TreeList<T>({ nodes, renderNode, defaultExpanded }: {
  nodes: Array<TreeNode<T>>;
  renderNode?: (node: TreeNode<T>) => ReactNode;
  defaultExpanded: Set<string>;
}) {
  return (
    <ul>
      {nodes.map((node) => (
        <TreeBranch key={node.id} node={node} renderNode={renderNode} defaultExpanded={defaultExpanded} />
      ))}
    </ul>
  );
}

export function Tree<T = unknown>({ nodes, renderNode, defaultExpanded = [], className }: TreeProps<T>) {
  return (
    <Column className={['tree', className].filter(Boolean).join(' ')}>
      <TreeList nodes={nodes} renderNode={renderNode} defaultExpanded={new Set(defaultExpanded)} />
    </Column>
  );
}
