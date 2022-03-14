import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import {
  PackageList,
  default as packageLists,
  Package,
} from "../../../lib/lists";

type Props = {
  listName: string;
  name: string;
};

const Page: NextPage<Props> = ({ listName, name }) => {
  const title = `barnard59 - ${name}`;
  const description = `Documentation for the ${name} package`;

  return (
    <div>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1>
          This package is part of the{" "}
          <Link href={`/package/${listName}`}>{listName}</Link> list
        </h1>
      </main>

      <footer>
        <p></p>
      </footer>
    </div>
  );
};

export async function getStaticProps(context: any) {
  const listName = context.params.listName;
  const name = context.params.name;

  return {
    props: {
      listName,
      name,
    },
  };
}

export async function getStaticPaths() {
  const paths = Object.keys(packageLists).flatMap((listName) => {
    const pkgs: Package[] = packageLists[listName]?.packages || [];

    return pkgs.map((pkg) => {
      return {
        params: {
          listName,
          name: pkg.name,
        },
      };
    });
  });

  return {
    paths,
    fallback: false,
  };
}

export default Page;
