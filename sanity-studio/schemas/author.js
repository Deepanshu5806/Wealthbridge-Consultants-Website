import { defineField, defineType } from 'sanity'

export default defineType({
  name:  'author',
  title: 'Author',
  type:  'document',

  preview: {
    select: { title: 'name', media: 'profileImage', subtitle: 'role' },
  },

  fields: [
    defineField({ name: 'name',  title: 'Full Name', type: 'string', validation: R => R.required() }),
    defineField({
      name:    'slug',
      title:   'Slug',
      type:    'slug',
      options: { source: 'name', maxLength: 64 },
    }),
    defineField({ name: 'role',  title: 'Role / Designation', type: 'string', description: 'E.g. Co-Founder & CEO, Research Analyst' }),
    defineField({ name: 'bio',   title: 'Short Bio', type: 'text', rows: 3 }),
    defineField({
      name:    'profileImage',
      title:   'Profile Photo',
      type:    'image',
      options: { hotspot: true },
      fields:  [defineField({ name: 'alt', title: 'Alt Text', type: 'string' })],
    }),
    defineField({ name: 'linkedin', title: 'LinkedIn URL', type: 'url' }),
    defineField({ name: 'twitter',  title: 'Twitter / X URL', type: 'url' }),
    defineField({ name: 'email',    title: 'Email (optional)', type: 'email' }),
  ],
})
