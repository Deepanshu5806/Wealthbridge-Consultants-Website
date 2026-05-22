import { defineConfig } from 'sanity'
import { deskTool }     from 'sanity/desk'
import { visionTool }   from '@sanity/vision'
import { schemaTypes }  from './schemas/index'

export default defineConfig({
  name:    'wealthbridge',
  title:   'WealthBridge CMS',

  // ──────────────────────────────────────────────────────────────
  // IMPORTANT: replace with your own Project ID from sanity.io/manage
  // ──────────────────────────────────────────────────────────────
  projectId: '1265gvop',
  dataset:   'production',

  plugins: [
    deskTool({
      structure: (S) =>
        S.list()
          .title('WealthBridge CMS')
          .items([
            S.listItem()
              .title('Blogs')
              .icon(() => '✍️')
              .child(
                S.documentList()
                  .title('Blogs')
                  .filter('_type == "post" && contentType == "blog"')
              ),
            S.listItem()
              .title('Market Updates')
              .icon(() => '📈')
              .child(
                S.documentList()
                  .title('Market Updates')
                  .filter('_type == "post" && contentType == "marketUpdate"')
              ),
            S.listItem()
              .title('Educational Articles')
              .icon(() => '🎓')
              .child(
                S.documentList()
                  .title('Educational Articles')
                  .filter('_type == "post" && contentType == "educational"')
              ),
            S.listItem()
              .title('Videos')
              .icon(() => '🎬')
              .child(
                S.documentList()
                  .title('Videos')
                  .filter('_type == "post" && contentType == "video"')
              ),
            S.listItem()
              .title('Infographics')
              .icon(() => '📊')
              .child(
                S.documentList()
                  .title('Infographics')
                  .filter('_type == "post" && contentType == "infographic"')
              ),
            S.listItem()
              .title('Research Reports')
              .icon(() => '📄')
              .child(
                S.documentList()
                  .title('Research Reports')
                  .filter('_type == "post" && contentType == "research"')
              ),
            S.divider(),
            S.listItem()
              .title('Authors')
              .icon(() => '👤')
              .child(S.documentTypeList('author').title('Authors')),
            S.listItem()
              .title('Categories')
              .icon(() => '🏷️')
              .child(S.documentTypeList('category').title('Categories')),
          ])
    }),
    visionTool(), // GROQ query playground (dev only)
  ],

  schema: {
    types: schemaTypes,
  },
})
