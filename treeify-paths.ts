export class PathTree<T = any> {
  declare ctx: T;
  constructor(public path: string = "") {}
  name: string = "";
  children: PathTree[] = [];
}

// Legacy
export class Node extends PathTree {}

function fill(
  node: PathTree,
  paths: PathContexts,
  options: Partial<Options> = {}
) {
  const children: Record<string, { paths: PathContexts; obj: PathTree }> = {};
  paths.forEach(([file, ctx]) => {
    const parts = file.split("/");
    const dir = parts[0];
    if (!children[dir]) {
      const fullPath = `${node.path}/${parts[0]}`;
      children[dir] = {
        paths: [],
        obj: new PathTree(fullPath.replace(/^\//, "")),
      };
    }
    if (parts.length == 1) {
      children[dir].obj.name = dir;
      children[dir].obj.ctx = ctx;
    } else {
      parts.shift();
      const rest = parts.join("/");
      children[dir].paths.push([rest, ctx]);
      children[dir].obj.ctx = ctx;
    }
  });
  const keys = Object.keys(children);
  if (options.caseInsensitive)
    keys.sort((a, b) =>
      a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase())
    );
  else keys.sort();
  keys.forEach((key) => {
    fill(children[key].obj, children[key].paths, options);
    node.children.push(children[key].obj);
  });
  if (options.directoriesFirst)
    node.children.sort((a, b) => {
      if (a.children.length && !b.children.length) return -1;
      if (b.children.length && !a.children.length) return 1;
      return -1;
    });
  else if (options.directoriesLast)
    node.children.sort((a, b) => {
      if (a.children.length && !b.children.length) return 1;
      if (b.children.length && !a.children.length) return -1;
      return -1;
    });
  return node;
}

export type Paths = string[];
export type PathContexts<Ctx = any> = [string, Ctx][];
export type Options = {
  caseInsensitive: boolean;
  directoriesFirst: boolean;
  directoriesLast: boolean;
};

export function treeifyPaths<Ctx>(
  paths: Paths | PathContexts<Ctx> = [],
  options: Partial<Options> = {}
): PathTree<Ctx> {
  const pathCtxs = isPaths(paths)
    ? paths.map((path): [string, Ctx] => [path, undefined])
    : paths;
  return fill(new PathTree(), pathCtxs, options);
}

export default treeifyPaths;

function isPaths(data: Paths | PathContexts): data is Paths {
  return typeof data[0] === "string";
}
