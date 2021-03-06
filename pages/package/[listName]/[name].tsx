import Breadcrumbs from "@mui/material/Breadcrumbs";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Operations from "../../../components/Operations";
import { default as packageLists } from "../../../lib/lists";
import {
  PackageInfo,
  packageInfo,
  PackageOperations,
  packageOperations,
} from "../../../lib/package";

type Props = {
  listName: string;
  name: string;
  info: PackageInfo;
  operations: PackageOperations;
};

const Page: NextPage<Props> = ({ listName, name, info, operations }) => {
  const title = `barnard59 - ${name}`;
  const description = `Documentation for the ${name} package`;

  const packageName = info.name;
  const packageVersion = info.version;
  const packageDescription = info.description;

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
          <Link href={`/package/${listName}`}>{listName}</Link>
          <Link
            href={`/package/${listName}/${packageName}`}
            aria-current="page"
          >
            {packageName}
          </Link>
        </Breadcrumbs>
        <h1>
          {packageName} <small>v{packageVersion}</small>
        </h1>

        {packageDescription && <p>{packageDescription}</p>}

        <Operations list={operations} />
      </main>
    </div>
  );
};

export async function getStaticProps(context: any) {
  const listName = context.params.listName;
  const name = context.params.name;

  const info = await packageInfo(name);
  const operations = await packageOperations(name);

  return {
    props: {
      listName,
      name,
      info,
      operations,
    },
  };
}

export async function getStaticPaths() {
  const paths = Object.keys(packageLists).flatMap((listName) => {
    const pkgs: string[] = packageLists[listName]?.packages || [];

    return pkgs.map((pkgName) => {
      return {
        params: {
          listName,
          name: pkgName,
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
