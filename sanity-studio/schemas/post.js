import { defineField, defineType } from 'sanity'

export default defineType({
  name:  'post',
  title: 'Content',
  type:  'document',

  /* Preview card shown in Sanity Studio list */
  preview: {
    select: {
      title:    'title',
      type:     'contentType',
      media:    'featuredImage',
      date:     'publishedAt',
    },
    prepare({ title, type, media, date }) {
      const icons = {
        blog: '✍️', marketUpdate: '📈', educational: '🎓',
        video: '🎬', infographic: '📊', research: '📄',
      }
      const d = date ? new Date(date).toLocaleDateString('en-IN') : 'Draft'
      return { title, subtitle: `${icons[type] || '📝'} ${type || 'post'} · ${d}`, media }
    },
  },

  fields: [
    /* ── Core ────────────────────────────────────────── */
    defineField({
      name:        'title',
      title:       'Title',
      type:        'string',
      description: 'Keep under 70 characters for best SEO results.',
      validation:  R => R.required().max(120),
    }),

    defineField({
      name:  'slug',
      title: 'URL Slug',
      type:  'slug',
      description: 'Auto-generated from title. This becomes the page URL.',
      options: { source: 'title', maxLength: 96 },
      validation: R => R.required(),
    }),

    defineField({
      name:    'contentType',
      title:   'Content Type',
      type:    'string',
      options: {
        list: [
          { title: '✍️  Blog',              value: 'blog'         },
          { title: '📈  Market Update',     value: 'marketUpdate' },
          { title: '🎓  Educational',       value: 'educational'  },
          { title: '🎬  Video',             value: 'video'        },
          { title: '📊  Infographic',       value: 'infographic'  },
          { title: '📄  Research Report',   value: 'research'     },
        ],
        layout: 'radio',
      },
      initialValue: 'blog',
      validation:   R => R.required(),
    }),

    defineField({
      name:       'publishedAt',
      title:      'Publish Date',
      type:       'datetime',
      initialValue: () => new Date().toISOString(),
      validation:   R => R.required(),
    }),

    defineField({
      name:  'featured',
      title: 'Feature this post?',
      type:  'boolean',
      description: 'Featured posts appear at the top of the Insights page.',
      initialValue: false,
    }),

    defineField({
      name:  'author',
      title: 'Author',
      type:  'reference',
      to:    [{ type: 'author' }],
    }),

    defineField({
      name:  'category',
      title: 'Category',
      type:  'reference',
      to:    [{ type: 'category' }],
    }),

    defineField({
      name:    'tags',
      title:   'Tags',
      type:    'array',
      of:      [{ type: 'string' }],
      options: { layout: 'tags' },
      description: 'E.g. US Stocks, Pre-IPO, SEBI, Golden Visa, Nasdaq',
    }),

    defineField({
      name:       'excerpt',
      title:      'Excerpt / Short Description',
      type:       'text',
      rows:       3,
      description: 'Short summary shown on listing cards. Keep under 160 chars.',
      validation:  R => R.max(300),
    }),

    defineField({
      name:  'featuredImage',
      title: 'Featured / Thumbnail Image',
      type:  'image',
      options: { hotspot: true },
      fields: [
        defineField({ name: 'alt', title: 'Alt Text', type: 'string', validation: R => R.required() }),
        defineField({ name: 'caption', title: 'Caption (optional)', type: 'string' }),
      ],
    }),

    /* ── Rich Text Body (Blogs / Educational / Market Updates) ── */
    defineField({
      name:    'body',
      title:   'Article Body',
      type:    'array',
      hidden:  ({ document }) => ['video', 'infographic', 'research'].includes(document?.contentType),
      of: [
        {
          type: 'block',
          styles: [
            { title: 'Normal',     value: 'normal'     },
            { title: 'Heading 2',  value: 'h2'         },
            { title: 'Heading 3',  value: 'h3'         },
            { title: 'Heading 4',  value: 'h4'         },
            { title: 'Quote',      value: 'blockquote' },
          ],
          lists:  [
            { title: 'Bullet',    value: 'bullet'    },
            { title: 'Numbered',  value: 'number'    },
          ],
          marks: {
            decorators: [
              { title: 'Bold',        value: 'strong'         },
              { title: 'Italic',      value: 'em'             },
              { title: 'Underline',   value: 'underline'      },
              { title: 'Strike',      value: 'strike-through' },
              { title: 'Code',        value: 'code'           },
            ],
            annotations: [
              {
                title: 'Link',
                name:  'link',
                type:  'object',
                fields: [
                  defineField({
                    name:    'href',
                    type:    'url',
                    title:   'URL',
                    validation: R => R.uri({ scheme: ['http', 'https', 'mailto', 'tel'] }),
                  }),
                  defineField({ name: 'blank', title: 'Open in new tab?', type: 'boolean', initialValue: true }),
                ],
              },
            ],
          },
        },
        /* Inline image inside body */
        {
          type:  'image',
          options: { hotspot: true },
          fields: [
            defineField({ name: 'alt',     title: 'Alt Text', type: 'string' }),
            defineField({ name: 'caption', title: 'Caption',  type: 'string' }),
          ],
        },
        /* Key stat callout block */
        {
          name:  'callout',
          title: 'Callout / Key Stat',
          type:  'object',
          fields: [
            defineField({ name: 'text', title: 'Callout Text', type: 'string' }),
            defineField({
              name:    'style',
              title:   'Style',
              type:    'string',
              options: { list: [
                { title: 'Info (Blue)',    value: 'info'    },
                { title: 'Warning',       value: 'warning' },
                { title: 'Success',       value: 'success' },
                { title: 'Key Stat',      value: 'stat'    },
              ]},
              initialValue: 'info',
            }),
          ],
        },
      ],
    }),

    /* ── Video Fields ──────────────────────────────── */
    defineField({
      name:    'videoUrl',
      title:   'YouTube / Video URL',
      type:    'url',
      hidden:  ({ document }) => document?.contentType !== 'video',
      description: 'Paste the YouTube URL (e.g. https://youtu.be/abc123)',
      validation: R => R.uri({ scheme: ['https', 'http'] }),
    }),

    defineField({
      name:    'videoDuration',
      title:   'Video Duration',
      type:    'string',
      hidden:  ({ document }) => document?.contentType !== 'video',
      description: 'E.g. 12:34',
    }),

    defineField({
      name:  'videoDescription',
      title: 'Video Summary',
      type:  'text',
      rows:  4,
      hidden: ({ document }) => document?.contentType !== 'video',
    }),

    /* ── Research Report Fields ────────────────────── */
    defineField({
      name:    'reportFile',
      title:   'Report PDF',
      type:    'file',
      hidden:  ({ document }) => document?.contentType !== 'research',
      options: { accept: '.pdf' },
      description: 'Upload the PDF report file.',
    }),

    defineField({
      name:    'reportYear',
      title:   'Report Year',
      type:    'string',
      hidden:  ({ document }) => document?.contentType !== 'research',
      description: 'E.g. 2025',
    }),

    defineField({
      name:    'reportPages',
      title:   'Number of Pages',
      type:    'number',
      hidden:  ({ document }) => document?.contentType !== 'research',
    }),

    /* ── CTA Section ───────────────────────────────── */
    defineField({
      name:  'cta',
      title: 'Call to Action (optional)',
      type:  'object',
      fields: [
        defineField({ name: 'heading',     title: 'Heading',      type: 'string' }),
        defineField({ name: 'description', title: 'Description',  type: 'text', rows: 2 }),
        defineField({ name: 'buttonText',  title: 'Button Text',  type: 'string' }),
        defineField({ name: 'buttonLink',  title: 'Button URL',   type: 'string' }),
      ],
    }),

    /* ── SEO ───────────────────────────────────────── */
    defineField({
      name:  'seo',
      title: '🔍 SEO Settings',
      type:  'object',
      description: 'Leaving blank uses the title and excerpt automatically.',
      fields: [
        defineField({
          name:        'metaTitle',
          title:       'Meta Title',
          type:        'string',
          description: 'Browser tab + Google title. Max 60 chars.',
          validation:  R => R.max(60),
        }),
        defineField({
          name:        'metaDescription',
          title:       'Meta Description',
          type:        'text',
          rows:        2,
          description: 'Google search snippet. Max 160 chars.',
          validation:  R => R.max(160),
        }),
        defineField({
          name:    'ogImage',
          title:   'Social Share Image',
          type:    'image',
          description: 'Image shown when shared on WhatsApp/LinkedIn/Twitter. 1200×630px recommended.',
          options: { hotspot: true },
        }),
        defineField({
          name:        'keywords',
          title:       'Focus Keywords',
          type:        'array',
          of:          [{ type: 'string' }],
          options:     { layout: 'tags' },
        }),
      ],
    }),
  ],

  orderings: [
    { title: 'Newest First', name: 'publishedAtDesc', by: [{ field: 'publishedAt', direction: 'desc' }] },
    { title: 'Oldest First', name: 'publishedAtAsc',  by: [{ field: 'publishedAt', direction: 'asc'  }] },
    { title: 'A → Z',        name: 'titleAsc',        by: [{ field: 'title',       direction: 'asc'  }] },
  ],
})
