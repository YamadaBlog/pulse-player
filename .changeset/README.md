# Changesets

Every pull request that changes a published package adds a changeset:

```bash
npm run changeset
```

Pick the packages, the bump type and write a one-line summary for users.
The release workflow turns pending changesets into a version PR, and
publishing that PR releases to npm with provenance.
