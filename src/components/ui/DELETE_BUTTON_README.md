# Equyvo Custom Delete Button

A beautiful, custom-styled delete button component that provides a consistent user experience across the Equyvo app.

## Features

- 🎨 **Custom Equyvo Design** - Matches the app's design language with red accent colors
- ⚠️ **Confirmation Dialog** - Beautiful alert dialog with warning icon and clear messaging
- 🔄 **Loading States** - Shows spinner animation during deletion
- 🌙 **Dark Mode Support** - Fully compatible with dark theme
- ♿ **Accessible** - Keyboard-friendly and screen reader compatible
- 🎯 **Multiple Variants** - Ghost, destructive, outline, and more
- 📱 **Responsive** - Works seamlessly across all device sizes

## Usage

### Basic Usage

```tsx
import DeleteButton from '@/components/ui/DeleteButton';

<DeleteButton
  onDelete={handleDelete}
  confirmationTitle="Delete this post?"
  confirmationDescription="This action cannot be undone."
/>
```

### Advanced Usage

```tsx
import DeleteButton from '@/components/ui/DeleteButton';

<DeleteButton
  onDelete={async () => {
    await deletePost(postId);
    showSuccess('Post deleted successfully');
  }}
  variant="outline"
  size="lg"
  confirmationTitle="Are you sure?"
  confirmationDescription="This will permanently delete the post and all associated data."
  confirmButtonText="Delete Forever"
  cancelButtonText="Keep Post"
  showIcon={true}
  disabled={isDeleting}
>
  Delete Post
</DeleteButton>
```

## Props

| Prop | Type | Default | Description |
|------|------|----------|-------------|
| `onDelete` | `() => Promise<void> \| void` | **Required** | Function called when delete is confirmed |
| `disabled` | `boolean` | `false` | Whether the button is disabled |
| `variant` | `'default' \| 'destructive' \| 'outline' \| 'secondary' \| 'ghost' \| 'link'` | `'ghost'` | Button style variant |
| `size` | `'default' \| 'sm' \| 'lg' \| 'icon'` | `'sm'` | Button size |
| `className` | `string` | `''` | Additional CSS classes |
| `children` | `React.ReactNode` | `'Delete'` | Button text/content |
| `confirmationTitle` | `string` | `'Delete this post?'` | Dialog title |
| `confirmationDescription` | `string` | `'This action cannot be undone...'` | Dialog description |
| `confirmButtonText` | `string` | `'Delete'` | Confirm button text |
| `cancelButtonText` | `string` | `'Cancel'` | Cancel button text |
| `showIcon` | `boolean` | `true` | Whether to show trash icon |

## Integration

The delete button is already integrated into:

- **ProfilePage** - All post delete buttons use the custom UI
- **StandardPostMenu** - Dropdown menu delete option
- **PostMenu** - Alternative post menu component

## Styling

The button uses Tailwind CSS classes with custom Equyvo theming:

- Red accent colors (`text-red-600`, `hover:bg-red-50`)
- Smooth transitions (`transition-all duration-200`)
- Focus states (`focus:ring-red-500`)
- Dark mode support (`dark:hover:bg-red-950/20`)

## Accessibility

- Full keyboard navigation support
- Screen reader friendly with proper ARIA labels
- Focus management in the dialog
- High contrast colors for visibility

## Examples

### Icon-only Button
```tsx
<DeleteButton
  onDelete={handleDelete}
  variant="ghost"
  size="icon"
  showIcon={true}
>
  <Trash2 className="h-4 w-4" />
</DeleteButton>
```

### Custom Styling
```tsx
<DeleteButton
  onDelete={handleDelete}
  className="border-red-200 hover:border-red-300"
  variant="outline"
>
  Remove Item
</DeleteButton>
```
