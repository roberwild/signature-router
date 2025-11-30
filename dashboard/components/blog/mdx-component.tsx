'use client';

import { MDXRemote, type MDXRemoteProps } from 'next-mdx-remote/rsc';

interface MdxProps {
  code: string;
  components?: MDXRemoteProps['components'];
}

export function Mdx({ code, components }: MdxProps) {
  return <MDXRemote source={code} components={components} />;
}

interface MDXComponentProps {
  source: MDXRemoteProps['source'];
  components?: MDXRemoteProps['components'];
}

export function MDXComponent({ source, components }: MDXComponentProps) {
  return <MDXRemote source={source} components={components} />;
}

export default MDXComponent;