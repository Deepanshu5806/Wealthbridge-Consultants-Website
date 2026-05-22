import { defineField, defineType } from 'sanity'

export default defineType({
  name:  'category',
  title: 'Category',
  type:  'document',

  preview: {
    select: { title: 'name', subtitle: 'description' },
  },

  fields: [
    defineField({ name: 'name', title: 'Category Name', type: 'string', validation: R => R.required() }),
    defineField({
      name:    'slug',
      title:   'Slug',
      type:    'slug',
      options: { source: 'name', maxLength: 64 },
      validation: R => R.required(),
    }),
    defineField({ name: 'description', title: 'Description', type: 'text', rows: 2 }),
    defineField({
      name:    'color',
      title:   'Badge Color',
      type:    'string',
      options: {
        list: [
          { title: 'Navy Blue',  value: '#0f2b4a' },
          { title: 'Royal Blue', value: '#1d4ed8' },
          { title: 'Green',      value: '#059669' },
          { title: 'Purple',     value: '#7c3aed' },
          { title: 'Orange',     value: '#ea580c' },
          { title: 'Gold',       value: '#b45309' },
          { title: 'Red',        value: '#dc2626' },
        ],
        layout: 'radio',
      },
      initialValue: '#0f2b4a',
    }),
  ],
})
