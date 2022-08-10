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
        <p>This page is listing all package collections.</p>
        {listNames
          .filter((l) => lists[l].packages.length > 0)
          .map((l, index) => {
            return (
              <div key={index}>
                <Link href={`/package/${l}`} passHref>
                  <h2 className="capitalize pointer">{l}</h2>
                </Link>
                {lists[l].description && <p>{lists[l].description}</p>}
                <ul>
                  {lists[l].packages.map((p, index) => {
                    return (
                      <li key={index}>
                        <Link href={`/package/${l}/${p}`}>{`${p}`}</Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
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
