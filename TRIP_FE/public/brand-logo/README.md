# Travia Brand Assets

## File List

| File | Ukuran | Kegunaan |
|---|---|---|
| `favicon.svg` | 32×32 | Browser tab (universal, dark & light) |
| `icon.svg` | 64×64 | App icon, avatar, UI element standalone |
| `logo-horizontal-dark.svg` | 320×64 | Navbar/header — dark theme |
| `logo-horizontal-light.svg` | 320×64 | Navbar/header — light theme |
| `logo-stacked-dark.svg` | 120×110 | Splash screen/sidebar — dark theme |
| `logo-stacked-light.svg` | 120×110 | Splash screen/sidebar — light theme |

---

## Cara Implementasi di React + Vite

### 1. Favicon (browser tab)

Taruh `favicon.svg` di folder `public/`, lalu di `index.html`:

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```

### 2. Logo di Navbar (React component)

```jsx
import logoHorizontalDark from '@/assets/brand/logo-horizontal-dark.svg'
import logoHorizontalLight from '@/assets/brand/logo-horizontal-light.svg'

const Navbar = () => {
  const { theme } = useTheme() // sesuaikan dengan theme system kamu

  return (
    <nav>
      <img
        src={theme === 'dark' ? logoHorizontalDark : logoHorizontalLight}
        alt="Travia — AI Travel Agent"
        height={40}
      />
    </nav>
  )
}
```

### 3. Logo Stacked (splash screen / sidebar)

```jsx
import logoStackedDark from '@/assets/brand/logo-stacked-dark.svg'
import logoStackedLight from '@/assets/brand/logo-stacked-light.svg'

const SplashScreen = () => {
  const { theme } = useTheme()

  return (
    <div className="splash">
      <img
        src={theme === 'dark' ? logoStackedDark : logoStackedLight}
        alt="Travia"
        width={120}
      />
    </div>
  )
}
```

### 4. Dengan Tailwind dark mode

```jsx
const Logo = () => (
  <>
    <img
      src={logoHorizontalDark}
      alt="Travia"
      className="hidden dark:block"
      height={40}
    />
    <img
      src={logoHorizontalLight}
      alt="Travia"
      className="block dark:hidden"
      height={40}
    />
  </>
)
```

---

## Brand Colors

```css
:root {
  --travia-orange: #FF6B35;
  --travia-dark-bg: #0F0F0F;
  --travia-light-bg: #FAFAF8;
  --travia-white: #FFFFFF;
}
```

## Typography

- **Wordmark:** Georgia, serif — italic, weight 700
- **Tagline:** Arial/Helvetica, sans-serif — weight 400, letter-spacing 3px
- **App font (rekomendasi):** Inter atau Plus Jakarta Sans untuk body text

---

## Folder Structure Rekomendasi

```
src/
  assets/
    brand/
      favicon.svg
      icon.svg
      logo-horizontal-dark.svg
      logo-horizontal-light.svg
      logo-stacked-dark.svg
      logo-stacked-light.svg
public/
  favicon.svg  ← copy dari assets/brand/
```
