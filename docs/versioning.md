# Product versions and changelog

Toools uses stable `major.minor.patch` product versions. Version tracking begins at **0.2.0** on November 2, 2026. The former `0.1.0` package placeholder is not reconstructed into an invented release history; no historical dates or Git tags have been added.

The public `/changelog` page and footer identify the version of the deployed build. The database-independent `/api/version` endpoint returns the product name, version, and release date so a deployment can be checked directly. Preparing local release files or passing `release:check` does not update the live website; deployment still uses the existing Vercel release process.

## One content source

Edit [`src/data/changelog.json`](../src/data/changelog.json). Its `releases` array is newest first and contains version, date, title, summary, and `added`, `changed`, and `fixed` lists. Its `unreleased` object uses the same note fields without a date or version. Dates are calendar dates (`YYYY-MM-DD`), and automatic release preparation uses **Asia/Shanghai** time.

The website imports this data directly. [`CHANGELOG.md`](../CHANGELOG.md) is generated for repository readers and should not be edited separately. `npm run release:notes` can also rebuild it if it is missing. `package.json`, both root version fields in `package-lock.json`, and the first release entry must agree. No additional version constant is maintained in the interface.

The SEO/GEO category expansion and twelve reviewed GitHub additions remain **Unreleased** until the separate catalog publication and verification are complete. Source changes, generated SQL, and local tests do not establish that catalog data is live.

## Record ongoing work

1. Add user-facing notes to `unreleased`. Describe the product change and its effect; keep deployment credentials and internal execution details out of public notes.
2. Regenerate the repository document and validate the versions:

   ```bash
   npm run release:notes
   npm run release:check
   ```

Empty change groups are allowed. A released entry must contain at least one actual change. Released entries have unique descending stable versions and dates ordered newest first.

## Prepare a version

Choose the smallest suitable increment:

| Increment | Use | Example from 0.2.0 |
| --- | --- | --- |
| `patch` | Corrections without a new product capability | 0.2.1 |
| `minor` | New functionality or a meaningful product expansion | 0.3.0 |
| `major` | Incompatible changes to established product behavior | 1.0.0 |

```bash
npm run release -- minor
# Optional explicit calendar date:
npm run release -- patch --date 2026-11-03
```

This command validates every input, moves the current unreleased notes into a new version, clears unreleased changes, and updates `package.json`, `package-lock.json`, the JSON data, and `CHANGELOG.md` together. It refuses an empty update, invalid dates, version drift, or an outdated generated document. File replacements are staged before writing, with restoration if a replacement fails. Review the resulting diff before using the normal repository and deployment process.

The command prepares a version locally. It does **not** commit, create a Git tag or GitHub Release, push, deploy, apply catalog SQL, or publish a pending tool. For a release that changes catalog data, first complete and verify the appropriate data publication; then move only the completed changes into release notes. If other work remains pending, keep it in `unreleased` rather than including it in that version.

## Verify a deployment and mark its source

After the existing Vercel workflow deploys the reviewed commit, request `GET https://toools.top/api/version` and confirm its `version` and `releasedAt` match that prepared release. Also inspect `/changelog` and the affected feature. A successful build or release-file check alone does not prove that version is live.

Once the deployed commit and version are confirmed, an operator can add an annotated tag to **that exact commit** and push just the tag. For example, for a verified `0.3.0` release:

```bash
git tag -a v0.3.0 <verified-commit-sha> -m "Toools 0.3.0"
git push origin v0.3.0
```

Replace the example version and commit with the verified values. Do not tag an unverified working tree, move an existing release tag, or use a successful local prepare as a deployment receipt. Creating a GitHub Release is a separate optional repository action.

## Checks

```bash
npm run release:check
node --test scripts/lib/release-management.test.mjs
npm run build
```

Every production build runs the release check first. The `Product release checks` GitHub Actions workflow also checks version consistency, generated notes, and release preparation on pull requests and pushes to `main`. It requires no database, service secrets, dependency installation, or write permission. Its tests use temporary directories and never prepare a version in the real checkout.
