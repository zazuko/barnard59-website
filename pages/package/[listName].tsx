import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { PackageList, default as packageLists, Package } from "../../lib/lists";

type Props = {
  listName: string;
  list: PackageList;
};

const Page: NextPage<Props> = ({ listName, list }) => {
  const title = `barnard59 - ${listName} packages`;
  const description =
    list?.description || `barnard59 packages for the ${listName} list`;
  const pkgs: Package[] = list.packages || [];

  return (
    <div>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1>{listName} packages</h1>
        {list?.description && <p>{list.description}</p>}

        {pkgs.length <= 0 && <p>This list does not contain any package.</p>}

        {pkgs.length > 0 && (
          <ul>
            {pkgs.map((pkg, index) => (
              <li key={index}>
                <Link href={`/package/${listName}/${pkg.name}`}>
                  {pkg.name}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {}
      </main>

      <footer>
        <p></p>
      </footer>
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
