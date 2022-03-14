import Breadcrumbs from "@mui/material/Breadcrumbs";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { PackageList, default as packageLists } from "../../lib/lists";

type Props = {
  listName: string;
  list: PackageList;
};

const Page: NextPage<Props> = ({ listName, list }) => {
  const title = `barnard59 - ${listName} packages`;
  const description =
    list?.description || `barnard59 packages for the ${listName} list`;
  const pkgs: string[] = list.packages || [];

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
          <Link href="/package">Packages</Link>
          <Link href={`/package/${listName}`} aria-current="page">
            {listName}
          </Link>
        </Breadcrumbs>
        <h1>{listName} packages</h1>
        {list?.description && <p>{list.description}</p>}

        {pkgs.length <= 0 && <p>This list does not contain any package.</p>}

        {pkgs.length > 0 && (
          <ul>
            {pkgs.map((pkg, index) => (
              <li key={index}>
                <Link href={`/package/${listName}/${pkg}`}>{pkg}</Link>
              </li>
            ))}
          </ul>
        )}

        {}
      </main>
    </div>
  );
};

export async function getStaticProps(context: any) {
  const listName = context.params.listName;
  const list = packageLists[listName];
  return {
    props: {
      listName,
      list,
    },
  };
}

export async function getStaticPaths() {
  const paths = Object.keys(packageLists).map((listName) => {
    return {
      params: {
        listName,
      },
    };
  });

  return {
    paths,
    fallback: false,
  };
}

export default Page;
