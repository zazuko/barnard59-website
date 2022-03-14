import Breadcrumbs from "@mui/material/Breadcrumbs";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { PackageLists, default as packageLists } from "../../lib/lists";

type Props = {
  lists: PackageLists;
};

const Page: NextPage<Props> = ({ lists }) => {
  const title = "barnard59 - lists of packages";
  const description = "List of barnard59 collections";

  const listNames = Object.keys(lists);

  return (
    <div>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <Breadcrumbs aria-label="breadcrumb">
          <Link href="/">Home</Link>
          <Link href="/package" aria-current="page">
            Packages
          </Link>
        </Breadcrumbs>
        <h1>Packages collections</h1>
        {listNames.map((l, index) => {
          return (
            <p key={index}>
              <Link href={`/package/${l}`}>{l}</Link>
            </p>
          );
        })}
      </main>
    </div>
  );
};

export async function getStaticProps(_context: any) {
  return {
    props: {
      lists: packageLists,
    },
  };
}

export default Page;
