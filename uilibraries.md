## Current visual direction

Use Whop’s official Frosted UI components, neutral near-black and white surfaces, blue primary actions, Inter typography, and a full-width header with spacious sidebar navigation. This supersedes the earlier library preferences below.

https://animejs.com/
npm i animejs
npx shadcn@latest add https://registry.watermelon.sh/r/<name>.json
Watermelon UI MCP Docs

Connection details and usage guidance for the hosted and local Watermelon MCP servers.
Hosted Endpoint

The hosted Watermelon MCP endpoint is https://mcp.watermelon.sh/mcp. Discovery metadata is available at mcp.watermelon.sh, health information is available at /health, and a short machine-readable overview is published at /llms.txt.
Available Tools

The hosted server searches the full public catalog. Use search for catalog discovery, get_component for source files and install details, get_inspiration to compare visual directions, compose_page to plan compatible page sections, and list_categories for accurate category counts. The earlier catalog tools remain available as compatibility aliases.
One-Command Setup

Connect the free hosted server with one command. No Watermelon account or API key is required.

# Claude Code
claude mcp add --transport http watermelon https://mcp.watermelon.sh/mcp

# Codex
codex mcp add watermelon --url https://mcp.watermelon.sh/mcp

For Cursor, add "watermelon": { "url": "https://mcp.watermelon.sh/mcp" } under mcpServers in .cursor/mcp.json.

Restart the client after setup, then try: “Search Watermelon for an animated pricing section and show me four options.” Follow with “Get the source and install command for the best match.”
Usage Analytics And Privacy

Watermelon records aggregate MCP handshake and tool-call counts to understand service health and improve the public catalog. The telemetry does not store IP addresses, session IDs, prompts, tool arguments, or client-provided version strings. Client names are reduced to broad categories such as chatgpt, claude, cursor, codex, or other.

Check the MCP health endpoint for the current public service and analytics configuration.
ChatGPT And Claude

Watermelon MCP is designed for MCP-compatible clients that support remote Streamable HTTP servers. That includes modern GPT- and Claude-oriented MCP workflows when the client supports remote MCP connections. The exact connection screen varies by app, but the value to enter is the hosted endpoint URL: https://mcp.watermelon.sh/mcp.

For manual setup: open MCP or tools settings, create a Streamable HTTP server named watermelon, paste https://mcp.watermelon.sh/mcp, save, and restart the client. Codex users can also run codex mcp add watermelon --url https://mcp.watermelon.sh/mcp.

If your client only supports local MCP servers, use the repository-backed local server instead by cloning watermelon-platform and running bun run mcp from the repository root.
When To Use MCP

Use the hosted MCP server when an agent needs structured Watermelon catalog access inside an MCP-native tool flow. Use the website when you want visual previews. Use /openapi.json and /api/docs when a plain HTTP integration is easier than a full MCP client.

Explore

    Animated
        Accordian
        Action
        Buttons
        Cards
        Carousel
        Choice-chips
        Dialog
        Disclosure
        Dropdown
        Filters
        Inputs
        Interaction
        Lists
        Map
        Marketing
        Media
        Micro-interaction
        Navigation
        Pagination
        Popover
        Scheduler
        Sliders
        Tabs
        Toggle
        Tooltip
        Widgets
    Component
        Accordion
        Alerts
        Avatar
        Badge
        Breadcrumb
        Button
        Button Group
        Calendar
        Card
        Checkbox
        Collapsible
        Combobox
        Data Table
        Date Picker
        Dialog
        Dropdown Menu
        Form
        Input Mask
        Input OTP
        Pagination
        Popover
        Radio Group
        Select
        Sheet
        Sonner
        Switch
        Table
        Tabs
        Textarea
        Tooltip


        export const title = "Installation"
export const description = "This guide will help you install Untitled UI and get set up quickly."
export const metaDescription = "Learn how to install and get set up quickly with Untitled UI React. Untitled UI React is the world's largest collection of open-source React components."

<Divider />

## Frameworks

Get up and running with our straightforward setup guides and official starter kits:

<div className="not-typography grid grid-cols-1 gap-3 mt-8 lg:grid-cols-2">
    <FileCard type="nextjs" title="Next.js" subtitle={<span>Click to open <a href="https://nextjs.org/docs/app/building-your-application/getting-started/create-next-app" target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-3 decoration-utility-neutral-300 transition duration-100 ease-linear outline-focus-ring hover:decoration-utility-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2">Next.js</a> starter kit.</span>} />
    <FileCard type="vite" title="Vite" subtitle={<span>Click to open <a href="https://vite.dev/" target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-3 decoration-utility-neutral-300 transition duration-100 ease-linear outline-focus-ring hover:decoration-utility-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2">Vite</a> starter kit.</span>} />
    <FileCard type="tanstack" title="TanStack Start" subtitle={<span>Click to open <a href="https://tanstack.com/start" target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-3 decoration-utility-neutral-300 transition duration-100 ease-linear outline-focus-ring hover:decoration-utility-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2">TanStack Start</a> starter kit.</span>} />
    <FileCard type="bolt" title="Bolt" subtitle={<span>Click to open <a href="https://bolt.new/" target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-3 decoration-utility-neutral-300 transition duration-100 ease-linear outline-focus-ring hover:decoration-utility-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2">Bolt</a> starter kit.</span>} />
    <FileCard type="claude" title="Claude" subtitle={<span>Click to open <a href="https://claude.ai/" target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-3 decoration-utility-neutral-300 transition duration-100 ease-linear outline-focus-ring hover:decoration-utility-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2">Claude</a> starter kit.</span>} />
    <FileCard type="v0" title="v0" subtitle={<span>Click to open <a href="https://v0.dev/" target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-3 decoration-utility-neutral-300 transition duration-100 ease-linear outline-focus-ring hover:decoration-utility-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2">v0</a> starter kit.</span>} />
    <FileCard type="lovable" title="Lovable" subtitle={<span>Click to open <a href="https://lovable.dev/" target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-3 decoration-utility-neutral-300 transition duration-100 ease-linear outline-focus-ring hover:decoration-utility-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2">Lovable</a> starter kit.</span>} />
    <FileCard type="tailwind" title="Manual" subtitle="For any stack with React + Tailwind CSS." href="/docs/installation#manual-installation" icon="arrow-down" />
</div>

<Divider />

## Installation via CLI

If you're starting a new project, simply use our CLI to scaffold a new Untitled UI project with pre-installed components and configurations:

<Tabs className="w-full mt-8">
    <TabList type="underline" items={[{ id:'next', label:'Next.js' }, { id:'vite', label:'Vite' }, { id:'tanstack', label:'TanStack Start' }]} />

    <TabPanel id="next">
        <Steps>
            <Step title="Create a new project">
                Run this command in your root folder to create a new Next.js project:

                ```bash
                npx untitledui@latest init --nextjs
                ```

                While running the command, you'll be asked a few questions to set up your project:

                ```bash
                ? What is your project named? › untitled-ui
                ? Which color would you like to use as the brand color? ›
                ❯   brand
                    red
                    orange
                    amber
                    yellow
                    lime
                    green
                    ...
                    zinc
                    neutral
                    stone
                ```
                
                This will create a new Next.js project in the `untitled-ui` directory with all the necessary configurations and components pre-installed. The choices are Tailwind's built-in palettes; picking one points the `--color-brand-*` variables in `theme.css` at it, and `brand` keeps the default purple. You can change the brand color at any time later (see [Theming](/docs/theming)).
            </Step>
            <Step title="Ready to go!">
                Great! You're all set to start using Untitled UI components.

                If something is missing, you can copy/paste what you need into your project directly from individual [components](/components) pages.

                **Need help?** Check our [GitHub repository](https://github.com/untitleduico/react/) for examples, or [open an issue](https://github.com/untitleduico/react/issues/) if you run into any problems. Our community is here to help!
            </Step>
        </Steps>
    </TabPanel>

    <TabPanel id="vite">
        <Steps>
            <Step title="Create a new project">
                Run this command in your root folder to create a new Vite project:

                ```bash
                npx untitledui@latest init --vite
                ```

                While running the command, you'll be asked a few questions to set up your project:

                ```bash
                ? What is your project named? › untitled-ui
                ? Which color would you like to use as the brand color? ›
                ❯   brand
                    red
                    orange
                    amber
                    yellow
                    lime
                    green
                    ...
                    zinc
                    neutral
                    stone
                ```

                This will create a new Vite project in the `untitled-ui` directory with all the necessary configurations and components pre-installed. The choices are Tailwind's built-in palettes; picking one points the `--color-brand-*` variables in `theme.css` at it, and `brand` keeps the default purple. You can change the brand color at any time later (see [Theming](/docs/theming)).
            </Step>
            <Step title="Ready to go!">
                Great! You're all set to start using Untitled UI components.

                If something is missing, you can copy/paste what you need into your project directly from individual [components](/components) pages.

                **Need help?** Check our [GitHub repository](https://github.com/untitleduico/react/) for examples, or [open an issue](https://github.com/untitleduico/react/issues/) if you run into any problems. Our community is here to help!
            </Step>
        </Steps>
    </TabPanel>

    <TabPanel id="tanstack">
        <Steps>
            <Step title="Create a new project">
                Run this command in your root folder to create a new TanStack Start project:

                ```bash
                npx untitledui@latest init --tanstack
                ```

                While running the command, you'll be asked a few questions to set up your project:

                ```bash
                ? What is your project named? › untitled-ui
                ? Which color would you like to use as the brand color? › - Use arrow-keys. Return to submit.
                ❯   brand
                    red
                    orange
                    amber
                    yellow
                    lime
                    green
                    ...
                    zinc
                    neutral
                    stone
                ```

                This will create a new TanStack Start project in the `untitled-ui` directory with all the necessary configurations and components pre-installed. The choices are Tailwind's built-in palettes; picking one points the `--color-brand-*` variables in `theme.css` at it, and `brand` keeps the default purple. You can change the brand color at any time later (see [Theming](/docs/theming)).
            </Step>
            <Step title="Ready to go!">
                Great! You're all set to start using Untitled UI components.

                If something is missing, you can copy/paste what you need into your project directly from individual [components](/components) pages.

                **Need help?** Check our [GitHub repository](https://github.com/untitleduico/react/) for examples, or [open an issue](https://github.com/untitleduico/react/issues/) if you run into any problems. Our community is here to help!
            </Step>
        </Steps>
    </TabPanel>
</Tabs>

<Divider />

## Manual installation

Before going further, make sure you have a project with Tailwind CSS set up. If not, you can follow the [Tailwind CSS installation guide](https://tailwindcss.com/docs/installation).

<Steps>
    <Step title="Install packages">
       Install the required packages with your favorite package manager:
        <CodeTabs>
            <CodeTabList items={[
                { id: "npm", label: "npm" },
                { id: "yarn", label: "yarn" },
                { id: "bun", label: "bun" },
            ]}/>
            <CodeTabPanel id="npm">
                ```bash
                npm install @untitledui/icons react-aria-components tailwindcss-react-aria-components tailwind-merge tailwindcss-animate
                ```
            </CodeTabPanel>
            <CodeTabPanel id="yarn">
                ```bash
                yarn add @untitledui/icons react-aria-components tailwindcss-react-aria-components tailwind-merge tailwindcss-animate
                ```
            </CodeTabPanel>
            <CodeTabPanel id="bun">
                ```bash
                bun add @untitledui/icons react-aria-components tailwindcss-react-aria-components tailwind-merge tailwindcss-animate
                ```
            </CodeTabPanel>
        </CodeTabs>

        Some components may require additional packages. You can find the required packages in the component's documentation.
    </Step>
    <Step title="Create a custom Tailwind CSS configuration">
        Create a `theme.css` file in your `styles` directory and add the following code:

        {/* @embed:start file="styles/theme.css" lang="css" */}
        ```css
        @theme {
            /* FONT FAMILY */
            --font-body: var(--font-inter, "Inter"), -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
            --font-display: var(--font-inter, "Inter"), -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
            --font-mono: ui-monospace, "Roboto Mono", SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;

            /* FONT SIZE */
            --text-xs: calc(var(--spacing) * 3);
            --text-xs--line-height: calc(var(--spacing) * 4.5);

            --text-sm: calc(var(--spacing) * 3.5);
            --text-sm--line-height: calc(var(--spacing) * 5);

            --text-md: calc(var(--spacing) * 4);
            --text-md--line-height: calc(var(--spacing) * 6);

            --text-lg: calc(var(--spacing) * 4.5);
            --text-lg--line-height: calc(var(--spacing) * 7);

            --text-xl: calc(var(--spacing) * 5);
            --text-xl--line-height: calc(var(--spacing) * 7.5);

            --text-display-xs: calc(var(--spacing) * 6);
            --text-display-xs--line-height: calc(var(--spacing) * 8);

            --text-display-sm: calc(var(--spacing) * 7.5);
            --text-display-sm--line-height: calc(var(--spacing) * 9.5);

            --text-display-md: calc(var(--spacing) * 9);
            --text-display-md--line-height: calc(var(--spacing) * 11);
            --text-display-md--letter-spacing: -0.72px;

            --text-display-lg: calc(var(--spacing) * 12);
            --text-display-lg--line-height: calc(var(--spacing) * 15);
            --text-display-lg--letter-spacing: -0.96px;

            --text-display-xl: calc(var(--spacing) * 15);
            --text-display-xl--line-height: calc(var(--spacing) * 18);
            --text-display-xl--letter-spacing: -1.2px;

            --text-display-2xl: calc(var(--spacing) * 18);
            --text-display-2xl--line-height: calc(var(--spacing) * 22.5);
            --text-display-2xl--letter-spacing: -1.44px;

            /* MAX WIDTH */
            --max-width-container: 1280px;

            /* BREAKPOINTS */
            --breakpoint-xxs: 320px;
            /* This must match the breakpoint in Sonner: https://github.com/emilkowalski/sonner/blob/main/src/styles.css */
            --breakpoint-xs: 600px;

            /* RADIUS */
            --radius-none: 0px;
            --radius-xs: 0.125rem;
            --radius-sm: 0.25rem;
            --radius-DEFAULT: 0.25rem;
            --radius-md: 0.375rem;
            --radius-lg: 0.5rem;
            --radius-xl: 0.75rem;
            --radius-2xl: 1rem;
            --radius-3xl: 1.5rem;
            --radius-full: 9999px;

            /* SHADOW */
            --shadow-xs: 0px 1px 2px rgba(0, 0, 0, 0.05);
            --shadow-sm: 0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px -1px rgba(0, 0, 0, 0.1);
            --shadow-md: 0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -2px rgba(0, 0, 0, 0.06);
            --shadow-lg: 0px 12px 16px -4px rgba(0, 0, 0, 0.08), 0px 4px 6px -2px rgba(0, 0, 0, 0.03), 0px 2px 2px -1px rgba(0, 0, 0, 0.04);
            --shadow-xl: 0px 20px 24px -4px rgba(0, 0, 0, 0.08), 0px 8px 8px -4px rgba(0, 0, 0, 0.03), 0px 3px 3px -1.5px rgba(0, 0, 0, 0.04);
            --shadow-2xl: 0px 24px 48px -12px rgba(0, 0, 0, 0.18), 0px 4px 4px -2px rgba(0, 0, 0, 0.04);
            --shadow-3xl: 0px 32px 64px -12px rgba(0, 0, 0, 0.14), 0px 5px 5px -2.5px rgba(0, 0, 0, 0.04);

            --shadow-skeuomorphic: 0px 0px 0px 1px rgba(0, 0, 0, 0.18) inset, 0px -2px 0px 0px rgba(0, 0, 0, 0.05) inset;
            --shadow-xs-skeuomorphic: var(--shadow-skeuomorphic), var(--shadow-xs);

            --shadow-modern-mockup-inner-lg: 0px 0px 3.765px 1.255px rgba(10, 13, 18, 0.08) inset, 0px 0px 2.51px 1.255px rgba(10, 13, 18, 0.03) inset;
            --shadow-modern-mockup-inner-md: 0px 0px 1.692px 0.564px rgba(10, 13, 18, 0.08) inset, 0px 0px 1.128px 0.564px rgba(10, 13, 18, 0.03) inset;
            --shadow-modern-mockup-inner-sm: 0px 0px 4.48px 1.493px rgba(10, 13, 18, 0.08) inset, 0px 0px 2.987px 1.493px rgba(10, 13, 18, 0.03) inset;

            --shadow-modern-mockup-outer-lg:
                0px 7.529px 10.039px -2.51px rgba(10, 13, 18, 0.08), 0px 2.51px 3.765px -1.255px rgba(10, 13, 18, 0.03),
                0px 1.255px 1.255px -0.627px rgba(10, 13, 18, 0.04);
            --shadow-modern-mockup-outer-md:
                0px 3.385px 4.513px -1.128px rgba(10, 13, 18, 0.08), 0px 1.128px 1.692px -0.564px rgba(10, 13, 18, 0.03),
                0px 0.564px 0.564px -0.282px rgba(10, 13, 18, 0.04);

            --drop-shadow-iphone-mockup: 20px 12px 18px rgba(16, 24, 40, 0.2);

            /* ANIMATIONS */
            --animate-marquee: marquee 60s linear infinite;
            --animate-caret-blink: caret-blink 1s infinite;

            @keyframes marquee {
                0% {
                    transform: translateX(0);
                }
                100% {
                    transform: translateX(-100%);
                }
            }

            @keyframes caret-blink {
                0%,
                50% {
                    opacity: 1;
                }
                51%,
                100% {
                    opacity: 0;
                }
            }

            /* BASE COLOR */
            --color-transparent: rgb(0 0 0 / 0);

            --color-white: rgb(255 255 255);
            --color-black: rgb(0 0 0);

            /* These will be inverted in dark mode. */
            --color-alpha-white: rgb(255 255 255);
            --color-alpha-black: rgb(0 0 0);

            --color-brand-50: rgb(249 245 255);
            --color-brand-100: rgb(244 235 255);
            --color-brand-200: rgb(233 215 254);
            --color-brand-300: rgb(214 187 251);
            --color-brand-400: rgb(182 146 246);
            --color-brand-500: rgb(158 119 237);
            --color-brand-600: rgb(127 86 217);
            --color-brand-700: rgb(105 65 198);
            --color-brand-800: rgb(83 56 158);
            --color-brand-900: rgb(66 48 125);
            --color-brand-950: rgb(44 28 95);

            /* LIGHT MODE VARIABLES */

            --color-alpha-white: rgb(255 255 255);
            --color-alpha-black: rgb(0 0 0);

            /* UTILITY COLORS */
            --color-utility-blue-50: var(--color-blue-50);
            --color-utility-blue-100: var(--color-blue-100);
            --color-utility-blue-200: var(--color-blue-200);
            --color-utility-blue-300: var(--color-blue-300);
            --color-utility-blue-400: var(--color-blue-400);
            --color-utility-blue-500: var(--color-blue-500);
            --color-utility-blue-600: var(--color-blue-600);
            --color-utility-blue-700: var(--color-blue-700);

            --color-utility-brand-50: var(--color-brand-50);
            --color-utility-brand-50_alt: var(--color-brand-50);
            --color-utility-brand-100: var(--color-brand-100);
            --color-utility-brand-100_alt: var(--color-brand-100);
            --color-utility-brand-200: var(--color-brand-200);
            --color-utility-brand-200_alt: var(--color-brand-200);
            --color-utility-brand-300: var(--color-brand-300);
            --color-utility-brand-300_alt: var(--color-brand-300);
            --color-utility-brand-400: var(--color-brand-400);
            --color-utility-brand-400_alt: var(--color-brand-400);
            --color-utility-brand-500: var(--color-brand-500);
            --color-utility-brand-500_alt: var(--color-brand-500);
            --color-utility-brand-600: var(--color-brand-600);
            --color-utility-brand-600_alt: var(--color-brand-600);
            --color-utility-brand-700: var(--color-brand-700);
            --color-utility-brand-700_alt: var(--color-brand-700);
            --color-utility-brand-800: var(--color-brand-800);
            --color-utility-brand-800_alt: var(--color-brand-800);
            --color-utility-brand-900: var(--color-brand-900);
            --color-utility-brand-900_alt: var(--color-brand-900);

            --color-utility-neutral-50: var(--color-neutral-50);
            --color-utility-neutral-100: var(--color-neutral-100);
            --color-utility-neutral-200: var(--color-neutral-200);
            --color-utility-neutral-300: var(--color-neutral-300);
            --color-utility-neutral-400: var(--color-neutral-400);
            --color-utility-neutral-500: var(--color-neutral-500);
            --color-utility-neutral-600: var(--color-neutral-600);
            --color-utility-neutral-700: var(--color-neutral-700);
            --color-utility-neutral-800: var(--color-neutral-800);
            --color-utility-neutral-900: var(--color-neutral-900);

            --color-utility-red-50: var(--color-red-50);
            --color-utility-red-100: var(--color-red-100);
            --color-utility-red-200: var(--color-red-200);
            --color-utility-red-300: var(--color-red-300);
            --color-utility-red-400: var(--color-red-400);
            --color-utility-red-500: var(--color-red-500);
            --color-utility-red-600: var(--color-red-600);
            --color-utility-red-700: var(--color-red-700);

            --color-utility-yellow-50: var(--color-yellow-50);
            --color-utility-yellow-100: var(--color-yellow-100);
            --color-utility-yellow-200: var(--color-yellow-200);
            --color-utility-yellow-300: var(--color-yellow-300);
            --color-utility-yellow-400: var(--color-yellow-400);
            --color-utility-yellow-500: var(--color-yellow-500);
            --color-utility-yellow-600: var(--color-yellow-600);
            --color-utility-yellow-700: var(--color-yellow-700);

            --color-utility-green-50: var(--color-green-50);
            --color-utility-green-100: var(--color-green-100);
            --color-utility-green-200: var(--color-green-200);
            --color-utility-green-300: var(--color-green-300);
            --color-utility-green-400: var(--color-green-400);
            --color-utility-green-500: var(--color-green-500);
            --color-utility-green-600: var(--color-green-600);
            --color-utility-green-700: var(--color-green-700);

            --color-utility-orange-50: var(--color-orange-50);
            --color-utility-orange-100: var(--color-orange-100);
            --color-utility-orange-200: var(--color-orange-200);
            --color-utility-orange-300: var(--color-orange-300);
            --color-utility-orange-400: var(--color-orange-400);
            --color-utility-orange-500: var(--color-orange-500);
            --color-utility-orange-600: var(--color-orange-600);
            --color-utility-orange-700: var(--color-orange-700);

            --color-utility-indigo-50: var(--color-indigo-50);
            --color-utility-indigo-100: var(--color-indigo-100);
            --color-utility-indigo-200: var(--color-indigo-200);
            --color-utility-indigo-300: var(--color-indigo-300);
            --color-utility-indigo-400: var(--color-indigo-400);
            --color-utility-indigo-500: var(--color-indigo-500);
            --color-utility-indigo-600: var(--color-indigo-600);
            --color-utility-indigo-700: var(--color-indigo-700);

            --color-utility-fuchsia-50: var(--color-fuchsia-50);
            --color-utility-fuchsia-100: var(--color-fuchsia-100);
            --color-utility-fuchsia-200: var(--color-fuchsia-200);
            --color-utility-fuchsia-300: var(--color-fuchsia-300);
            --color-utility-fuchsia-400: var(--color-fuchsia-400);
            --color-utility-fuchsia-500: var(--color-fuchsia-500);
            --color-utility-fuchsia-600: var(--color-fuchsia-600);
            --color-utility-fuchsia-700: var(--color-fuchsia-700);

            --color-utility-pink-50: var(--color-pink-50);
            --color-utility-pink-100: var(--color-pink-100);
            --color-utility-pink-200: var(--color-pink-200);
            --color-utility-pink-300: var(--color-pink-300);
            --color-utility-pink-400: var(--color-pink-400);
            --color-utility-pink-500: var(--color-pink-500);
            --color-utility-pink-600: var(--color-pink-600);
            --color-utility-pink-700: var(--color-pink-700);

            --color-utility-purple-50: var(--color-purple-50);
            --color-utility-purple-100: var(--color-purple-100);
            --color-utility-purple-200: var(--color-purple-200);
            --color-utility-purple-300: var(--color-purple-300);
            --color-utility-purple-400: var(--color-purple-400);
            --color-utility-purple-500: var(--color-purple-500);
            --color-utility-purple-600: var(--color-purple-600);
            --color-utility-purple-700: var(--color-purple-700);

            --color-utility-sky-50: var(--color-sky-50);
            --color-utility-sky-100: var(--color-sky-100);
            --color-utility-sky-200: var(--color-sky-200);
            --color-utility-sky-300: var(--color-sky-300);
            --color-utility-sky-400: var(--color-sky-400);
            --color-utility-sky-500: var(--color-sky-500);
            --color-utility-sky-600: var(--color-sky-600);
            --color-utility-sky-700: var(--color-sky-700);

            --color-utility-slate-50: var(--color-slate-50);
            --color-utility-slate-100: var(--color-slate-100);
            --color-utility-slate-200: var(--color-slate-200);
            --color-utility-slate-300: var(--color-slate-300);
            --color-utility-slate-400: var(--color-slate-400);
            --color-utility-slate-500: var(--color-slate-500);
            --color-utility-slate-600: var(--color-slate-600);
            --color-utility-slate-700: var(--color-slate-700);

            --color-utility-emerald-50: var(--color-emerald-50);
            --color-utility-emerald-100: var(--color-emerald-100);
            --color-utility-emerald-200: var(--color-emerald-200);
            --color-utility-emerald-300: var(--color-emerald-300);
            --color-utility-emerald-400: var(--color-emerald-400);
            --color-utility-emerald-500: var(--color-emerald-500);
            --color-utility-emerald-600: var(--color-emerald-600);
            --color-utility-emerald-700: var(--color-emerald-700);

            --color-utility-amber-50: var(--color-amber-50);
            --color-utility-amber-100: var(--color-amber-100);
            --color-utility-amber-200: var(--color-amber-200);
            --color-utility-amber-300: var(--color-amber-300);
            --color-utility-amber-400: var(--color-amber-400);
            --color-utility-amber-500: var(--color-amber-500);
            --color-utility-amber-600: var(--color-amber-600);
            --color-utility-amber-700: var(--color-amber-700);

            /* TEXT COLORS */
            --color-text-primary: var(--color-neutral-900);
            --color-text-tertiary: var(--color-neutral-600);
            --color-text-error-primary: var(--color-red-600);
            --color-text-warning-primary: var(--color-yellow-600);
            --color-text-success-primary: var(--color-green-600);
            --color-text-white: var(--color-white);
            --color-text-secondary: var(--color-neutral-700);
            --color-text-secondary_hover: var(--color-neutral-800);
            --color-text-tertiary_hover: var(--color-neutral-700);
            --color-text-brand-secondary: var(--color-brand-700);
            --color-text-placeholder: var(--color-neutral-500);
            --color-text-brand-tertiary: var(--color-brand-600);
            --color-text-editor-icon-fg: var(--color-neutral-400);
            --color-text-editor-icon-fg_active: var(--color-neutral-500);
            --color-text-quaternary: var(--color-neutral-500);
            --color-text-brand-primary: var(--color-brand-900);
            --color-text-primary_on-brand: var(--color-white);
            --color-text-secondary_on-brand: var(--color-brand-200);
            --color-text-tertiary_on-brand: var(--color-brand-200);
            --color-text-quaternary_on-brand: var(--color-brand-300);
            --color-text-brand-tertiary_alt: var(--color-brand-600);
            --color-text-error-primary_hover: var(--color-red-700);
            --color-text-brand-secondary_hover: var(--color-brand-800);

            /* BORDER COLORS */
            --color-border-primary: var(--color-neutral-300);
            --color-border-secondary: var(--color-neutral-200);
            --color-border-secondary_alt: rgb(0 0 0 / 0.1);
            --color-border-tertiary: var(--color-neutral-100);
            --color-border-error: var(--color-red-500);
            --color-border-error_subtle: var(--color-red-300);
            --color-border-brand: var(--color-brand-500);
            --color-border-brand_alt: var(--color-brand-600);

            /* FOREGROUND COLORS */
            --color-fg-secondary: var(--color-neutral-700);
            --color-fg-warning-primary: var(--color-yellow-600);
            --color-fg-success-primary: var(--color-green-600);
            --color-fg-white: var(--color-white);
            --color-fg-success-secondary: var(--color-green-500);
            --color-fg-secondary_hover: var(--color-neutral-800);
            --color-fg-primary: var(--color-neutral-900);
            --color-fg-brand-secondary: var(--color-brand-500);
            --color-fg-brand-primary: var(--color-brand-600);
            --color-fg-quaternary: var(--color-neutral-400);
            --color-fg-quaternary_hover: var(--color-neutral-500);
            --color-fg-error-primary: var(--color-red-600);
            --color-fg-warning-secondary: var(--color-yellow-500);
            --color-fg-error-secondary: var(--color-red-500);
            --color-fg-tertiary: var(--color-neutral-600);
            --color-fg-tertiary_hover: var(--color-neutral-700);
            --color-fg-brand-primary_alt: var(--color-fg-brand-primary);
            --color-fg-brand-secondary_alt: var(--color-fg-brand-secondary);
            --color-fg-brand-secondary_hover: var(--color-brand-600);

            /* BACKGROUND COLORS */
            --color-bg-primary: var(--color-white);
            --color-bg-tertiary: var(--color-neutral-100);
            --color-bg-brand-primary: var(--color-brand-50);
            --color-bg-error-secondary: var(--color-red-100);
            --color-bg-warning-primary: var(--color-yellow-50);
            --color-bg-warning-secondary: var(--color-yellow-100);
            --color-bg-success-primary: var(--color-green-50);
            --color-bg-success-secondary: var(--color-green-100);
            --color-bg-brand-solid: var(--color-brand-600);
            --color-bg-secondary-solid: var(--color-neutral-600);
            --color-bg-error-solid: var(--color-red-600);
            --color-bg-warning-solid: var(--color-yellow-600);
            --color-bg-success-solid: var(--color-green-600);
            --color-bg-secondary_hover: var(--color-neutral-100);
            --color-bg-primary_hover: var(--color-neutral-50);
            --color-bg-active: var(--color-neutral-50);
            --color-bg-brand-solid_hover: var(--color-brand-700);
            --color-bg-error-primary: var(--color-red-50);
            --color-bg-brand-secondary: var(--color-brand-100);
            --color-bg-secondary: var(--color-neutral-50);
            --color-bg-quaternary: var(--color-neutral-200);
            --color-bg-primary_alt: var(--color-white);
            --color-bg-brand-primary_alt: var(--color-brand-50);
            --color-bg-secondary_alt: var(--color-neutral-50);
            --color-bg-overlay: var(--color-neutral-950);
            --color-bg-brand-section: var(--color-brand-800);
            --color-bg-brand-section_subtle: var(--color-brand-700);
            --color-bg-primary-solid: var(--color-neutral-950);
            --color-bg-error-solid_hover: var(--color-red-700);

            /* COMPONENT COLORS */
            --color-app-store-badge-border: 166 166 166 1;
            --color-avatar-styles-bg-neutral: 224 224 224 1;
            --color-featured-icon-light-fg-brand: var(--color-brand-600);
            --color-featured-icon-light-fg-error: var(--color-red-600);
            --color-featured-icon-light-fg-gray: var(--color-neutral-500);
            --color-featured-icon-light-fg-success: var(--color-green-600);
            --color-featured-icon-light-fg-warning: var(--color-yellow-600);
            --color-focus-ring-error: var(--color-red-500);
            --color-focus-ring: var(--color-brand-500);
            --color-footer-button-fg: var(--color-brand-200);
            --color-footer-button-fg_hover: var(--color-white);
            --color-icon-fg-brand: var(--color-brand-600);
            --color-icon-fg-brand_on-brand: var(--color-brand-200);
            --color-screen-mockup-border: var(--color-neutral-900);

            --color-slider-handle-bg: var(--color-white);
            --color-slider-handle-border: var(--color-brand-600);
            --color-toggle-border: var(--color-neutral-300);
            --color-toggle-slim-border_pressed-hover: var(--color-bg-brand-solid_hover);
            --color-toggle-slim-border_pressed: var(--color-bg-brand-solid);
            --color-tooltip-supporting-text: var(--color-neutral-300);

            /* BACKGROUND PROPERTY COLORS */
            --background-color-primary: var(--color-bg-primary);
            --background-color-tertiary: var(--color-bg-tertiary);
            --background-color-brand-primary: var(--color-bg-brand-primary);
            --background-color-error-secondary: var(--color-bg-error-secondary);
            --background-color-warning-primary: var(--color-bg-warning-primary);
            --background-color-warning-secondary: var(--color-bg-warning-secondary);
            --background-color-success-primary: var(--color-bg-success-primary);
            --background-color-success-secondary: var(--color-bg-success-secondary);
            --background-color-brand-solid: var(--color-bg-brand-solid);
            --background-color-secondary-solid: var(--color-bg-secondary-solid);
            --background-color-error-solid: var(--color-bg-error-solid);
            --background-color-warning-solid: var(--color-bg-warning-solid);
            --background-color-success-solid: var(--color-bg-success-solid);
            --background-color-secondary_hover: var(--color-bg-secondary_hover);
            --background-color-primary_hover: var(--color-bg-primary_hover);
            --background-color-active: var(--color-bg-active);
            --background-color-brand-solid_hover: var(--color-bg-brand-solid_hover);
            --background-color-error-primary: var(--color-bg-error-primary);
            --background-color-brand-secondary: var(--color-bg-brand-secondary);
            --background-color-secondary: var(--color-bg-secondary);
            --background-color-quaternary: var(--color-bg-quaternary);
            --background-color-primary_alt: var(--color-bg-primary_alt);
            --background-color-brand-primary_alt: var(--color-bg-brand-primary_alt);
            --background-color-secondary_alt: var(--color-bg-secondary_alt);
            --background-color-overlay: var(--color-bg-overlay);
            --background-color-brand-section: var(--color-bg-brand-section);
            --background-color-brand-section_subtle: var(--color-bg-brand-section_subtle);
            --background-color-primary-solid: var(--color-bg-primary-solid);
            --background-color-error-solid_hover: var(--color-bg-error-solid_hover);
            --background-color-border-brand: var(--color-border-brand);
            --background-color-border-brand_alt: var(--color-border-brand_alt);

            /* TEXT PROPERTY COLORS */
            --color-text-white: var(--color-white);
            --text-color-primary: var(--color-text-primary);
            --text-color-secondary: var(--color-text-secondary);
            --text-color-secondary_hover: var(--color-text-secondary_hover);
            --text-color-tertiary: var(--color-text-tertiary);
            --text-color-tertiary_hover: var(--color-text-tertiary_hover);
            --text-color-error-primary: var(--color-text-error-primary);
            --text-color-warning-primary: var(--color-text-warning-primary);
            --text-color-success-primary: var(--color-text-success-primary);
            --text-color-brand-secondary: var(--color-text-brand-secondary);
            --text-color-placeholder: var(--color-text-placeholder);
            --text-color-brand-tertiary: var(--color-text-brand-tertiary);
            --text-color-editor-icon-fg: var(--color-text-editor-icon-fg);
            --text-color-editor-icon-fg_active: var(--color-text-editor-icon-fg_active);
            --text-color-quaternary: var(--color-text-quaternary);
            --text-color-brand-primary: var(--color-text-brand-primary);
            --text-color-primary_on-brand: var(--color-text-primary_on-brand);
            --text-color-secondary_on-brand: var(--color-text-secondary_on-brand);
            --text-color-tertiary_on-brand: var(--color-text-tertiary_on-brand);
            --text-color-quaternary_on-brand: var(--color-text-quaternary_on-brand);
            --text-color-brand-tertiary_alt: var(--color-text-brand-tertiary_alt);
            --text-color-error-primary_hover: var(--color-text-error-primary_hover);
            --text-color-brand-secondary_hover: var(--color-text-brand-secondary_hover);
            --text-color-tooltip-supporting-text: var(--color-tooltip-supporting-text);

            /* BORDER PROPERTY COLORS */
            --border-color-primary: var(--color-border-primary);
            --border-color-secondary: var(--color-border-secondary);
            --border-color-secondary_alt: var(--color-border-secondary_alt);
            --border-color-tertiary: var(--color-border-tertiary);
            --border-color-error: var(--color-border-error);
            --border-color-error_subtle: var(--color-border-error_subtle);
            --border-color-brand: var(--color-border-brand);
            --border-color-brand_alt: var(--color-border-brand_alt);
            --border-color-brand-solid: var(--color-bg-brand-solid);
            --border-color-brand-solid_hover: var(--color-bg-brand-solid_hover);

            /* RING PROPERTY COLORS */
            --ring-color-primary: var(--color-border-primary);
            --ring-color-secondary: var(--color-border-secondary);
            --ring-color-secondary_alt: var(--color-border-secondary_alt);
            --ring-color-tertiary: var(--color-border-tertiary);
            --ring-color-error: var(--color-border-error);
            --ring-color-error_subtle: var(--color-border-error_subtle);
            --ring-color-brand: var(--color-border-brand);
            --ring-color-brand_alt: var(--color-border-brand_alt);
            --ring-color-brand-solid: var(--color-bg-brand-solid);
            --ring-color-brand-solid_hover: var(--color-bg-brand-solid_hover);

            /* OUTLINE PROPERTY COLORS */
            --outline-color-primary: var(--color-border-primary);
            --outline-color-secondary: var(--color-border-secondary);
            --outline-color-secondary_alt: var(--color-border-secondary_alt);
            --outline-color-tertiary: var(--color-border-tertiary);
            --outline-color-error: var(--color-border-error);
            --outline-color-error_subtle: var(--color-border-error_subtle);
            --outline-color-brand: var(--color-border-brand);
            --outline-color-brand_alt: var(--color-border-brand_alt);
            --outline-color-brand-solid: var(--color-bg-brand-solid);
            --outline-color-brand-solid_hover: var(--color-bg-brand-solid_hover);
        }

        @layer base {
            /* DARK MODE VARIABLES */

            .dark-mode {
                --color-alpha-white: rgb(12 14 18);
                --color-alpha-black: rgb(255 255 255);

                /* UTILITY COLORS */

                --color-utility-blue-50: var(--color-blue-950);
                --color-utility-blue-100: var(--color-blue-900);
                --color-utility-blue-200: var(--color-blue-800);
                --color-utility-blue-300: var(--color-blue-700);
                --color-utility-blue-400: var(--color-blue-600);
                --color-utility-blue-500: var(--color-blue-500);
                --color-utility-blue-600: var(--color-blue-400);
                --color-utility-blue-700: var(--color-blue-300);

                --color-utility-brand-50: var(--color-brand-950);
                --color-utility-brand-50_alt: var(--color-utility-neutral-50);
                --color-utility-brand-100: var(--color-brand-900);
                --color-utility-brand-100_alt: var(--color-utility-neutral-100);
                --color-utility-brand-200: var(--color-brand-800);
                --color-utility-brand-200_alt: var(--color-utility-neutral-200);
                --color-utility-brand-300: var(--color-brand-700);
                --color-utility-brand-300_alt: var(--color-utility-neutral-300);
                --color-utility-brand-400: var(--color-brand-600);
                --color-utility-brand-400_alt: var(--color-utility-neutral-400);
                --color-utility-brand-500: var(--color-brand-500);
                --color-utility-brand-500_alt: var(--color-utility-neutral-500);
                --color-utility-brand-600: var(--color-brand-400);
                --color-utility-brand-600_alt: var(--color-utility-neutral-600);
                --color-utility-brand-700: var(--color-brand-300);
                --color-utility-brand-700_alt: var(--color-utility-neutral-700);
                --color-utility-brand-800: var(--color-brand-200);
                --color-utility-brand-800_alt: var(--color-utility-neutral-800);
                --color-utility-brand-900: var(--color-brand-100);
                --color-utility-brand-900_alt: var(--color-utility-neutral-900);

                --color-utility-neutral-50: var(--color-neutral-900);
                --color-utility-neutral-100: var(--color-neutral-800);
                --color-utility-neutral-200: var(--color-neutral-700);
                --color-utility-neutral-300: var(--color-neutral-700);
                --color-utility-neutral-400: var(--color-neutral-600);
                --color-utility-neutral-500: var(--color-neutral-500);
                --color-utility-neutral-600: var(--color-neutral-400);
                --color-utility-neutral-700: var(--color-neutral-300);
                --color-utility-neutral-800: var(--color-neutral-200);
                --color-utility-neutral-900: var(--color-neutral-100);

                --color-utility-red-50: var(--color-red-950);
                --color-utility-red-100: var(--color-red-900);
                --color-utility-red-200: var(--color-red-800);
                --color-utility-red-300: var(--color-red-700);
                --color-utility-red-400: var(--color-red-600);
                --color-utility-red-500: var(--color-red-500);
                --color-utility-red-600: var(--color-red-400);
                --color-utility-red-700: var(--color-red-300);

                --color-utility-yellow-50: var(--color-yellow-950);
                --color-utility-yellow-100: var(--color-yellow-900);
                --color-utility-yellow-200: var(--color-yellow-800);
                --color-utility-yellow-300: var(--color-yellow-700);
                --color-utility-yellow-400: var(--color-yellow-600);
                --color-utility-yellow-500: var(--color-yellow-500);
                --color-utility-yellow-600: var(--color-yellow-400);
                --color-utility-yellow-700: var(--color-yellow-300);

                --color-utility-green-50: var(--color-green-950);
                --color-utility-green-100: var(--color-green-900);
                --color-utility-green-200: var(--color-green-800);
                --color-utility-green-300: var(--color-green-700);
                --color-utility-green-400: var(--color-green-600);
                --color-utility-green-500: var(--color-green-500);
                --color-utility-green-600: var(--color-green-400);
                --color-utility-green-700: var(--color-green-300);

                --color-utility-orange-50: var(--color-orange-950);
                --color-utility-orange-100: var(--color-orange-900);
                --color-utility-orange-200: var(--color-orange-800);
                --color-utility-orange-300: var(--color-orange-700);
                --color-utility-orange-400: var(--color-orange-600);
                --color-utility-orange-500: var(--color-orange-500);
                --color-utility-orange-600: var(--color-orange-400);
                --color-utility-orange-700: var(--color-orange-300);

                --color-utility-indigo-50: var(--color-indigo-950);
                --color-utility-indigo-100: var(--color-indigo-900);
                --color-utility-indigo-200: var(--color-indigo-800);
                --color-utility-indigo-300: var(--color-indigo-700);
                --color-utility-indigo-400: var(--color-indigo-600);
                --color-utility-indigo-500: var(--color-indigo-500);
                --color-utility-indigo-600: var(--color-indigo-400);
                --color-utility-indigo-700: var(--color-indigo-300);

                --color-utility-fuchsia-50: var(--color-fuchsia-950);
                --color-utility-fuchsia-100: var(--color-fuchsia-900);
                --color-utility-fuchsia-200: var(--color-fuchsia-800);
                --color-utility-fuchsia-300: var(--color-fuchsia-700);
                --color-utility-fuchsia-400: var(--color-fuchsia-600);
                --color-utility-fuchsia-500: var(--color-fuchsia-500);
                --color-utility-fuchsia-600: var(--color-fuchsia-400);
                --color-utility-fuchsia-700: var(--color-fuchsia-300);

                --color-utility-pink-50: var(--color-pink-950);
                --color-utility-pink-100: var(--color-pink-900);
                --color-utility-pink-200: var(--color-pink-800);
                --color-utility-pink-300: var(--color-pink-700);
                --color-utility-pink-400: var(--color-pink-600);
                --color-utility-pink-500: var(--color-pink-500);
                --color-utility-pink-600: var(--color-pink-400);
                --color-utility-pink-700: var(--color-pink-300);

                --color-utility-purple-50: var(--color-purple-950);
                --color-utility-purple-100: var(--color-purple-900);
                --color-utility-purple-200: var(--color-purple-800);
                --color-utility-purple-300: var(--color-purple-700);
                --color-utility-purple-400: var(--color-purple-600);
                --color-utility-purple-500: var(--color-purple-500);
                --color-utility-purple-600: var(--color-purple-400);
                --color-utility-purple-700: var(--color-purple-300);

                --color-utility-sky-50: var(--color-sky-950);
                --color-utility-sky-100: var(--color-sky-900);
                --color-utility-sky-200: var(--color-sky-800);
                --color-utility-sky-300: var(--color-sky-700);
                --color-utility-sky-400: var(--color-sky-600);
                --color-utility-sky-500: var(--color-sky-500);
                --color-utility-sky-600: var(--color-sky-400);
                --color-utility-sky-700: var(--color-sky-300);

                --color-utility-slate-50: var(--color-slate-950);
                --color-utility-slate-100: var(--color-slate-900);
                --color-utility-slate-200: var(--color-slate-800);
                --color-utility-slate-300: var(--color-slate-700);
                --color-utility-slate-400: var(--color-slate-600);
                --color-utility-slate-500: var(--color-slate-500);
                --color-utility-slate-600: var(--color-slate-400);
                --color-utility-slate-700: var(--color-slate-300);

                --color-utility-emerald-50: var(--color-emerald-950);
                --color-utility-emerald-100: var(--color-emerald-900);
                --color-utility-emerald-200: var(--color-emerald-800);
                --color-utility-emerald-300: var(--color-emerald-700);
                --color-utility-emerald-400: var(--color-emerald-600);
                --color-utility-emerald-500: var(--color-emerald-500);
                --color-utility-emerald-600: var(--color-emerald-400);
                --color-utility-emerald-700: var(--color-emerald-300);

                --color-utility-amber-50: var(--color-amber-950);
                --color-utility-amber-100: var(--color-amber-900);
                --color-utility-amber-200: var(--color-amber-800);
                --color-utility-amber-300: var(--color-amber-700);
                --color-utility-amber-400: var(--color-amber-600);
                --color-utility-amber-500: var(--color-amber-500);
                --color-utility-amber-600: var(--color-amber-400);
                --color-utility-amber-700: var(--color-amber-300);

                --color-text-primary: var(--color-neutral-50);
                --color-text-tertiary: var(--color-neutral-400);
                --color-text-error-primary: var(--color-red-400);
                --color-text-warning-primary: var(--color-yellow-400);
                --color-text-success-primary: var(--color-green-400);
                --color-text-white: var(--color-white);
                --color-text-secondary: var(--color-neutral-300);
                --color-text-secondary_hover: var(--color-neutral-200);
                --color-text-tertiary_hover: var(--color-neutral-300);
                --color-text-brand-secondary: var(--color-neutral-300);
                --color-text-placeholder: var(--color-neutral-500);
                --color-text-brand-tertiary: var(--color-neutral-400);
                --color-text-editor-icon-fg: var(--color-neutral-400);
                --color-text-editor-icon-fg_active: var(--color-white);
                --color-text-quaternary: var(--color-neutral-400);
                --color-text-brand-primary: var(--color-neutral-50);
                --color-text-primary_on-brand: var(--color-neutral-50);
                --color-text-secondary_on-brand: var(--color-neutral-300);
                --color-text-tertiary_on-brand: var(--color-neutral-400);
                --color-text-quaternary_on-brand: var(--color-neutral-400);
                --color-text-brand-tertiary_alt: var(--color-neutral-50);
                --color-text-error-primary_hover: var(--color-red-300);
                --color-text-brand-secondary_hover: var(--color-neutral-200);

                --color-border-secondary: var(--color-neutral-800);
                --color-border-error_subtle: var(--color-red-500);
                --color-border-primary: var(--color-neutral-700);
                --color-border-brand: var(--color-brand-400);
                --color-border-error: var(--color-red-400);
                --color-border-tertiary: var(--color-neutral-800);
                --color-border-brand_alt: var(--color-neutral-700);
                --color-border-secondary_alt: var(--color-neutral-800);

                --color-fg-secondary: var(--color-neutral-300);
                --color-fg-warning-primary: var(--color-yellow-500);
                --color-fg-success-primary: var(--color-green-500);
                --color-fg-white: var(--color-white);
                --color-fg-success-secondary: var(--color-green-400);
                --color-fg-secondary_hover: var(--color-neutral-200);
                --color-fg-primary: var(--color-white);
                --color-fg-brand-secondary: var(--color-brand-500);
                --color-fg-brand-primary: var(--color-brand-500);
                --color-fg-quaternary: var(--color-neutral-600);
                --color-fg-quaternary_hover: var(--color-neutral-500);
                --color-fg-error-primary: var(--color-red-500);
                --color-fg-warning-secondary: var(--color-yellow-400);
                --color-fg-error-secondary: var(--color-red-400);
                --color-fg-tertiary: var(--color-neutral-400);
                --color-fg-tertiary_hover: var(--color-neutral-300);
                --color-fg-brand-primary_alt: var(--color-neutral-300);
                --color-fg-brand-secondary_alt: var(--color-neutral-600);
                --color-fg-brand-secondary_hover: var(--color-neutral-500);

                --color-bg-primary: var(--color-neutral-950);
                --color-bg-tertiary: var(--color-neutral-800);
                --color-bg-brand-primary: var(--color-brand-500);
                --color-bg-error-secondary: var(--color-red-600);
                --color-bg-warning-primary: var(--color-yellow-950);
                --color-bg-warning-secondary: var(--color-yellow-600);
                --color-bg-success-primary: var(--color-green-950);
                --color-bg-success-secondary: var(--color-green-600);
                --color-bg-brand-solid: var(--color-brand-600);
                --color-bg-secondary-solid: var(--color-neutral-600);
                --color-bg-error-solid: var(--color-red-600);
                --color-bg-warning-solid: var(--color-yellow-600);
                --color-bg-success-solid: var(--color-green-600);
                --color-bg-secondary_hover: var(--color-neutral-800);
                --color-bg-primary_hover: var(--color-neutral-900);
                --color-bg-active: var(--color-neutral-800);
                --color-bg-brand-solid_hover: var(--color-brand-500);
                --color-bg-error-primary: var(--color-red-950);
                --color-bg-brand-secondary: var(--color-brand-600);
                --color-bg-secondary: var(--color-neutral-900);
                --color-bg-quaternary: var(--color-neutral-700);
                --color-bg-primary_alt: var(--color-bg-secondary);
                --color-bg-brand-primary_alt: var(--color-bg-secondary);
                --color-bg-secondary_alt: var(--color-bg-primary);
                --color-bg-overlay: var(--color-neutral-800);
                --color-bg-brand-section: var(--color-bg-secondary);
                --color-bg-brand-section_subtle: var(--color-bg-primary);
                --color-bg-primary-solid: var(--color-bg-secondary);
                --color-bg-error-solid_hover: var(--color-red-500);

                --color-app-store-badge-border: var(--color-white);
                --color-avatar-styles-bg-neutral: 224 224 224 1;
                --color-featured-icon-light-fg-brand: var(--color-brand-200);
                --color-featured-icon-light-fg-error: var(--color-red-200);
                --color-featured-icon-light-fg-gray: var(--color-neutral-200);
                --color-featured-icon-light-fg-success: var(--color-green-200);
                --color-featured-icon-light-fg-warning: var(--color-yellow-200);
                --color-focus-ring-error: var(--color-red-500);
                --color-focus-ring: var(--color-brand-500);
                --color-footer-button-fg: var(--color-neutral-300);
                --color-footer-button-fg_hover: var(--color-neutral-100);
                --color-icon-fg-brand: var(--color-neutral-400);
                --color-icon-fg-brand_on-brand: var(--color-neutral-400);
                --color-screen-mockup-border: var(--color-neutral-700);
                --color-slider-handle-bg: var(--color-fg-brand-primary);
                --color-slider-handle-border: var(--color-bg-primary);
                --color-toggle-border: var(--color-transparent);
                --color-toggle-slim-border_pressed-hover: var(--color-transparent);
                --color-toggle-slim-border_pressed: var(--color-transparent);
                --color-tooltip-supporting-text: var(--color-neutral-300);

                /* BACKGROUND PROPERTY COLORS */
                --background-color-primary: var(--color-bg-primary);
                --background-color-tertiary: var(--color-bg-tertiary);
                --background-color-brand-primary: var(--color-bg-brand-primary);
                --background-color-error-secondary: var(--color-bg-error-secondary);
                --background-color-warning-primary: var(--color-bg-warning-primary);
                --background-color-warning-secondary: var(--color-bg-warning-secondary);
                --background-color-success-primary: var(--color-bg-success-primary);
                --background-color-success-secondary: var(--color-bg-success-secondary);
                --background-color-brand-solid: var(--color-bg-brand-solid);
                --background-color-secondary-solid: var(--color-bg-secondary-solid);
                --background-color-error-solid: var(--color-bg-error-solid);
                --background-color-warning-solid: var(--color-bg-warning-solid);
                --background-color-success-solid: var(--color-bg-success-solid);
                --background-color-secondary_hover: var(--color-bg-secondary_hover);
                --background-color-primary_hover: var(--color-bg-primary_hover);
                --background-color-active: var(--color-bg-active);
                --background-color-brand-solid_hover: var(--color-bg-brand-solid_hover);
                --background-color-error-primary: var(--color-bg-error-primary);
                --background-color-brand-secondary: var(--color-bg-brand-secondary);
                --background-color-secondary: var(--color-bg-secondary);
                --background-color-quaternary: var(--color-bg-quaternary);
                --background-color-primary_alt: var(--color-bg-primary_alt);
                --background-color-brand-primary_alt: var(--color-bg-brand-primary_alt);
                --background-color-secondary_alt: var(--color-bg-secondary_alt);
                --background-color-overlay: var(--color-bg-overlay);
                --background-color-brand-section: var(--color-bg-brand-section);
                --background-color-brand-section_subtle: var(--color-bg-brand-section_subtle);
                --background-color-primary-solid: var(--color-bg-primary-solid);
                --background-color-error-solid_hover: var(--color-bg-error-solid_hover);

                --background-color-border-brand: var(--color-border-brand);
                --background-color-border-tertiary: var(--color-border-tertiary);
                --background-color-border-brand_alt: var(--color-border-brand_alt);

                /* TEXT PROPERTY COLORS */
                --text-color-primary: var(--color-text-primary);
                --text-color-tertiary: var(--color-text-tertiary);
                --text-color-error-primary: var(--color-text-error-primary);
                --text-color-warning-primary: var(--color-text-warning-primary);
                --text-color-success-primary: var(--color-text-success-primary);
                --text-color-white: var(--color-text-white);
                --text-color-secondary: var(--color-text-secondary);
                --text-color-secondary_hover: var(--color-text-secondary_hover);
                --text-color-tertiary_hover: var(--color-text-tertiary_hover);
                --text-color-brand-secondary: var(--color-text-brand-secondary);
                --text-color-placeholder: var(--color-text-placeholder);
                --text-color-brand-tertiary: var(--color-text-brand-tertiary);
                --text-color-editor-icon-fg: var(--color-text-editor-icon-fg);
                --text-color-editor-icon-fg_active: var(--color-text-editor-icon-fg_active);
                --text-color-quaternary: var(--color-text-quaternary);
                --text-color-brand-primary: var(--color-text-brand-primary);
                --text-color-primary_on-brand: var(--color-text-primary_on-brand);
                --text-color-secondary_on-brand: var(--color-text-secondary_on-brand);
                --text-color-tertiary_on-brand: var(--color-text-tertiary_on-brand);
                --text-color-quaternary_on-brand: var(--color-text-quaternary_on-brand);
                --text-color-brand-tertiary_alt: var(--color-text-brand-tertiary_alt);
                --text-color-error-primary_hover: var(--color-text-error-primary_hover);
                --text-color-brand-secondary_hover: var(--color-text-brand-secondary_hover);
                --text-color-tooltip-supporting-text: var(--color-tooltip-supporting-text);

                /* BORDER PROPERTY COLORS */
                --border-color-primary: var(--color-border-primary);
                --border-color-secondary: var(--color-border-secondary);
                --border-color-secondary_alt: var(--color-border-secondary_alt);
                --border-color-tertiary: var(--color-border-tertiary);
                --border-color-error: var(--color-border-error);
                --border-color-error_subtle: var(--color-border-error_subtle);
                --border-color-brand: var(--color-border-brand);
                --border-color-brand_alt: var(--color-border-brand_alt);
                --border-color-brand-solid: var(--color-bg-brand-solid);
                --border-color-brand-solid_hover: var(--color-bg-brand-solid_hover);

                /* RING PROPERTY COLORS */
                --ring-color-primary: var(--color-border-primary);
                --ring-color-secondary: var(--color-border-secondary);
                --ring-color-secondary_alt: var(--color-border-secondary_alt);
                --ring-color-tertiary: var(--color-border-tertiary);
                --ring-color-error: var(--color-border-error);
                --ring-color-error_subtle: var(--color-border-error_subtle);
                --ring-color-brand: var(--color-border-brand);
                --ring-color-brand-solid: var(--color-bg-brand-solid);
                --ring-color-brand-solid_hover: var(--color-bg-brand-solid_hover);
                --ring-color-brand_alt: var(--color-border-brand_alt);

                /* OUTLINE PROPERTY COLORS */
                --outline-color-primary: var(--color-border-primary);
                --outline-color-secondary: var(--color-border-secondary);
                --outline-color-secondary_alt: var(--color-border-secondary_alt);
                --outline-color-tertiary: var(--color-border-tertiary);
                --outline-color-error: var(--color-border-error);
                --outline-color-error_subtle: var(--color-border-error_subtle);
                --outline-color-brand: var(--color-border-brand);
                --outline-color-brand-solid: var(--color-bg-brand-solid);
                --outline-color-brand-solid_hover: var(--color-bg-brand-solid_hover);
                --outline-color-brand_alt: var(--color-border-brand_alt);
            }
        }
        ```
        {/* @embed:end */}
    </Step>
    <Step title="Extend Tailwind CSS config">
        Now, in your `globals.css` file, import the `theme.css` and necessary plugins:

        ```javascript
        @import "tailwindcss";
        @import "./theme.css";

        @plugin "tailwindcss-animate";
        @plugin "tailwindcss-react-aria-components";

        @custom-variant dark (&:where(.dark-mode, .dark-mode *));
        @custom-variant label (& [data-label]);
        @custom-variant focus-input-within (&:has(input:focus));

        @utility scrollbar-hide {
            /* For Webkit-based browsers (Chrome, Safari and Opera) */
            &::-webkit-scrollbar {
                display: none;
                -webkit-appearance: none;
            }

            /* For IE, Edge and Firefox */
            -ms-overflow-style: none; /* IE and Edge */
            scrollbar-width: none; /* Firefox */
        }

        @utility transition-inherit-all {
            transition-property: inherit;
            transition-duration: inherit;
            transition-timing-function: inherit;
        }

        html,
        body {
            font-family: var(--font-body);
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            -webkit-font-variant-ligatures: contextual;
            font-variant-ligatures: contextual;
            -webkit-font-kerning: normal;
            font-kerning: normal;
        }

        /* Hide the default expand arrow on Safari.  */
        details summary::-webkit-details-marker {
            display: none;
        }

        /* Hide default arrows from number inputs. */
        /* Chrome, Safari, Edge, Opera */
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        /* Firefox */
        input[type="number"] {
            -moz-appearance: textfield;
        }

        /* Hide the default clear button (X) from search inputs. */
        input[type="search"]::-webkit-search-cancel-button {
            -webkit-appearance: none;
        }

        /* Hide the default outline on chart elements. */
        .recharts-surface,
        .recharts-surface g,
        .recharts-surface path {
            outline: none;
        }
        ```
    </Step>
    <Step title="Add utility functions">
        In order to make the development experience slightly better we have added a few utility functions which we'll use throughout our project. Create these files under `utils` and `hooks` directories.

        <CodeTabs>
            <CodeTabList items={[
                { id: "cx", label: "utils/cx.ts" },
                { id: "isreact", label: "utils/is-react-component.ts" },
                { id: "usebreakpoint", label: "hooks/use-breakpoint.ts" },
                { id: "useclipboard", label: "hooks/use-clipboard.ts" }
            ]}/>
            <CodeTabPanel id="cx">
                ```ts
                import { extendTailwindMerge } from "tailwind-merge";

                const twMerge = extendTailwindMerge({
                    extend: {
                        theme: {
                            text: ["display-xs", "display-sm", "display-md", "display-lg", "display-xl", "display-2xl"],
                        },
                    },
                });

                /**
                 * This function is a wrapper around the twMerge function.
                 * It is used to merge the classes inside style objects.
                 */
                export const cx = twMerge;

                /**
                 * This function does nothing besides helping us to be able to
                 * sort the classes inside style objects which is not supported
                 * by the Tailwind IntelliSense by default.
                 */
                export function sortCx<T extends Record<string, string | number | Record<string, string | number | Record<string, string | number>>>>(classes: T): T {
                    return classes;
                }
                ```
            </CodeTabPanel>
            <CodeTabPanel id="isreact">
                ```ts
                /* We cannot use type `unknown` instead of `any` here because it will break the type assertion `isReactComponent` function is providing. */
                /* eslint-disable @typescript-eslint/no-explicit-any */
                import type React from "react";

                type ReactComponent = React.FC<any> | React.ComponentClass<any, any>;

                /**
                 * Checks if a given value is a function component.
                 */
                export const isFunctionComponent = (component: any): component is React.FC<any> => {
                    return typeof component === "function";
                };

                /**
                 * Checks if a given value is a class component.
                 */
                export const isClassComponent = (component: any): component is React.ComponentClass<any, any> => {
                    return typeof component === "function" && component.prototype && (!!component.prototype.isReactComponent || !!component.prototype.render);
                };

                /**
                 * Checks if a given value is a forward ref component.
                 */
                export const isForwardRefComponent = (component: any): component is React.ForwardRefExoticComponent<any> => {
                    return typeof component === "object" && component !== null && component.$$typeof.toString() === "Symbol(react.forward_ref)";
                };

                /**
                 * Checks if a given value is a valid React component.
                 */
                export const isReactComponent = (component: any): component is ReactComponent => {
                    return isFunctionComponent(component) || isForwardRefComponent(component) || isClassComponent(component);
                };
                ```
            </CodeTabPanel>
            <CodeTabPanel id="usebreakpoint">
                ```ts
                "use client";

                import { useEffect, useState } from "react";

                const screens = {
                    sm: "640px",
                    md: "768px",
                    lg: "1024px",
                    xl: "1280px",
                    "2xl": "1536px",
                };

                /**
                 * Checks whether a particular Tailwind CSS viewport size applies.
                 *
                 * @param size The size to check, which must either be included in Tailwind CSS's
                 * list of default screen sizes, or added to the Tailwind CSS config file.
                 *
                 * @returns A boolean indicating whether the viewport size applies.
                 */
                export const useBreakpoint = (size: "sm" | "md" | "lg" | "xl" | "2xl") => {
                    const [matches, setMatches] = useState(typeof window !== "undefined" ? window.matchMedia(`(min-width: ${screens[size]})`).matches : true);

                    useEffect(() => {
                        const breakpoint = window.matchMedia(`(min-width: ${screens[size]})`);

                        setMatches(breakpoint.matches);

                        const handleChange = (value: MediaQueryListEvent) => setMatches(value.matches);

                        breakpoint.addEventListener("change", handleChange);
                        return () => breakpoint.removeEventListener("change", handleChange);
                    }, [size]);

                    return matches;
                };
                ```
            </CodeTabPanel>
            <CodeTabPanel id="useclipboard">
                ```ts
                "use client";

                import { useCallback, useState } from "react";

                const DEFAULT_TIMEOUT = 2000;

                type UseClipboardReturnType = {
                    /**
                     * The state indicating whether the text has been copied.
                     * If a string is provided, it will be used as the identifier for the copied state.
                     */
                    copied: string | boolean;
                    /**
                     * Function to copy text to the clipboard using the modern clipboard API.
                     * Falls back to the fallback function if the modern API fails.
                     *
                     * @param {string} text - The text to be copied.
                     * @param {string} [id] - Optional identifier to set the copied state.
                     * @returns {Promise<Object>} - A promise that resolves to an object containing:
                     *  - `success` (boolean): Whether the copy operation was successful.
                     *  - `error` (Error | undefined): The error object if the copy operation failed.
                     */
                    copy: (text: string, id?: string) => Promise<{ success: boolean; error?: Error }>;
                };

                /**
                 * Custom hook to copy text to the clipboard.
                 *
                 * @returns {UseClipboardReturnType} - An object containing the copied state and the copy function.
                 */
                export const useClipboard = (): UseClipboardReturnType => {
                    const [copied, setCopied] = useState<string | boolean>(false);

                    // Fallback function for older browsers
                    const fallback = (text: string, id?: string) => {
                        try {
                            // Textarea to copy the text to the clipboard
                            const textArea = document.createElement("textarea");
                            textArea.value = text;
                            textArea.style.position = "absolute";
                            textArea.style.left = "-99999px";

                            document.body.appendChild(textArea);
                            textArea.select();

                            const success = document.execCommand("copy");
                            textArea.remove();

                            setCopied(id || true);
                            setTimeout(() => setCopied(false), DEFAULT_TIMEOUT);

                            return success ? { success: true } : { success: false, error: new Error("execCommand returned false") };
                        } catch (err) {
                            return {
                                success: false,
                                error: err instanceof Error ? err : new Error("Fallback copy failed"),
                            };
                        }
                    };

                    const copy = useCallback(async (text: string, id?: string) => {
                        if (navigator.clipboard && window.isSecureContext) {
                            try {
                                await navigator.clipboard.writeText(text);

                                setCopied(id || true);
                                setTimeout(() => setCopied(false), DEFAULT_TIMEOUT);

                                return { success: true };
                            } catch {
                                // If modern method fails, try fallback
                                return fallback(text, id);
                            }
                        }
                        return fallback(text);
                    }, []);

                    return { copied, copy };
                };
                ```
            </CodeTabPanel>
        </CodeTabs>
    </Step>
    <Step title="Framework integration">
        Depending on the framework you're using, you might need to do some additional setup (i.e. adding a route provider, a theme provider, etc.).

        Check out our [Next.js](/integrations/nextjs) and [Vite](/integrations/vite) integration guides for framework-specific information.
    </Step>
    <Step title="Ready to go!">
        Great! You're all set to start using Untitled UI components.

        If something is missing, you can copy/paste what you need into your project directly from individual [components](/components) pages.

        **Need help?** Check our [GitHub repository](https://github.com/untitleduico/react/) for examples, or [open an issue](https://github.com/untitleduico/react/issues/) if you run into any problems. Our community is here to help!
    </Step>

</Steps>

<Divider />

<FAQ
    faqs={[
        {
            question: "What tech stack does Untitled UI React use?",
            answer: "Untitled UI React components are built with and powered by:\n\n- [React v19.3](https://react.dev/blog/2026/09/09/react-19-3)\n- [Tailwind CSS v4.3](https://tailwindcss.com/blog/tailwindcss-v4)\n- [TypeScript v6.0](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html)\n- [React Aria Components v1.21](https://react-spectrum.adobe.com/react-aria/index.html)\n\nYou own the code, so you can build and extend it without relying on third-party maintainers.",
        },
        {
            question: "Do I need to install all components?",
            answer: "No, you can install only the components you need. You do need the core setup files: `globals.css`, `theme.css` and the `cx` utility in `utils/cx.ts`.\n\nAdd components individually with `npx untitledui@latest add [component-name]`, or copy the code from the individual [component pages](https://www.untitledui.com/react/components).",
        },
        {
            question: "Which packages do I need to install for a manual setup?",
            answer: "Install `@untitledui/icons`, `react-aria-components`, `tailwindcss-react-aria-components`, `tailwind-merge` and `tailwindcss-animate` in a project that already has React and Tailwind CSS. Some components need extra packages, which are listed on each component's page. The CLI installs a component's dependencies for you when you use `add`.",
        },
        {
            question: "Can I use Untitled UI React with Vue, Svelte, or other JS frameworks?",
            answer: "The components are built specifically for React. However, the Tailwind tokens are framework-agnostic and can be used in any project that supports Tailwind CSS v4.\n\nTo use them outside React, copy the `theme.css` and `globals.css` files from the [manual installation steps](https://www.untitledui.com/react/docs/installation#manual-installation) into your project and import them in your main stylesheet.",
        },
        {
            question: "How do I update Untitled UI components?",
            answer: "If you've installed components using our CLI, update them by running `npx untitledui@latest add [component-name] --overwrite`. This replaces your local copy, so commit any customizations first.\n\nIf you've added components manually, copy the latest code from the individual [component pages](https://www.untitledui.com/react/components).",
        },
        {
            question: "Can I customize the components after installation?",
            answer: "Yes, you own the code, so you can modify and extend it as needed. Update styles with Tailwind CSS classes, edit the component code directly, or change the variables in `theme.css` to match your brand.",
        },
        {
            question: "Can I use a different CSS framework?",
            answer: "Untitled UI React is built specifically for [Tailwind CSS](https://tailwindcss.com/). Adapting the components to another CSS framework would mean rewriting their styles, so we recommend using Tailwind CSS.",
        },
    ]}
/>
git clone https://github.com/untitleduico/untitledui-nextjs-starter-kit
npm install motion && npx motion-ai
These are official instructions from HeroUI to set up a good AI development environment for building UIs with HeroUI v3 (`@heroui/react`).

Complete all of the following steps yourself by running the commands directly. Do not ask the user to run any of these commands.

- Install the HeroUI skill and register the HeroUI MCP server

---

## 1. Install the HeroUI skill

The installer detects your tool (Claude Code, Cursor, OpenCode, and more) and places the skill in the correct directory:

```
curl -fsSL https://heroui.com/install | bash -s heroui-react
```

Or using the skills package:

```
npx skills add heroui-inc/heroui
```

## 2. Register the HeroUI MCP server

The MCP gives your agent live access to component docs, source code, CSS, and theme variables. Use the correct section for your agent below.

### Claude Code

```
claude mcp add heroui-react -- npx -y @heroui/react-mcp@latest
```

### Cursor — `.cursor/mcp.json`

Add under `"mcpServers"`:

```json
"heroui-react": { "command": "npx", "args": ["-y", "@heroui/react-mcp@latest"] }
```

### VS Code — `.vscode/mcp.json`

Add under `"servers"`:

```json
"heroui-react": { "type": "stdio", "command": "npx", "args": ["-y", "@heroui/react-mcp@latest"] }
```

### Windsurf — `.windsurf/mcp.json`

Add under `"mcpServers"`:

```json
"heroui-react": { "command": "npx", "args": ["-y", "@heroui/react-mcp@latest"] }
```

### Zed — `settings.json`

Add under `"context_servers"`:

```json
"heroui-react": { "command": "npx", "args": ["-y", "@heroui/react-mcp@latest"], "env": {} }
```

### Codex — `~/.codex/config.toml`

```toml
[mcp_servers.heroui-react]
command = "npx"
args = ["-y", "@heroui/react-mcp@latest"]
```

### OpenCode — `opencode.json`

Add under `"mcp"`:

```json
"heroui-react": { "type": "local", "command": ["npx", "-y", "@heroui/react-mcp@latest"] }
```

Restart the agent after adding the config, then verify the `heroui-react` MCP is connected.

Once done, tell the user:

```
✓ Skill: heroui-react
✓ MCP server: heroui-react
⚡ Restart your agent to load the MCP server
```

---

## Resources

- Quick Start: https://heroui.com/docs/react/getting-started/quick-start
- MCP server: https://heroui.com/docs/react/getting-started/mcp-server
- Agent Skills: https://heroui.com/docs/react/getting-started/agent-skills

These instructions are published at https://heroui.com/docs/react/getting-started so you can re-verify their authenticity at any time.
Components
Accordion
Alert
AlertDialog
Autocomplete
Avatar
NewAvatarGroup
Badge
Breadcrumbs
Button
ButtonGroup
UpdatedCalendar
Card
UpdatedCheckbox
UpdatedCheckboxGroup
Chip
CloseButton
ColorArea
ColorField
ColorPicker
ColorSlider
ColorSwatch
ColorSwatchPicker
NewComboBox
DateField
DatePicker
DateRangePicker
Description
Disclosure
DisclosureGroup
Drawer
Dropdown
ErrorMessage
FieldError
Fieldset
Form
Input
InputGroup
InputOTP
Kbd
Label
Link
ListBox
Meter
Modal
NumberField
Pagination
Popover
ProgressBar
ProgressCircle
UpdatedRadioGroup
RangeCalendar
ScrollShadow
SearchField
Select
Separator
NewSheet
Skeleton
Slider
Spinner
Surface
UpdatedSwitch
UpdatedTable
NewTabs
TagGroup
TextArea
TextField
TimeField
UpdatedToast
ToggleButton
ToggleButtonGroup
Toolbar
UpdatedTooltip
Typography
---
title: Installation
description: How to install dependencies and structure your app.
---

<Callout className="mb-6 border-emerald-600 bg-emerald-100 dark:border-emerald-400 dark:bg-emerald-900">

**Recommended for new projects:** Use [shadcn/create](/create) to build your preset visually and generate the right setup command for your framework.

</Callout>

Choose the setup that matches your starting point.

<div className="mt-6 grid gap-4 sm:grid-cols-3 sm:gap-6">
  <LinkedCard
    href="#use-create"
    className="items-start gap-1 p-6 text-sm md:p-6"
  >
    <div className="font-medium">Use shadcn/create</div>
    <div className="leading-relaxed text-muted-foreground">
      Build your preset visually and generate a setup command.
    </div>
  </LinkedCard>
  <LinkedCard href="#use-cli" className="items-start gap-1 p-6 text-sm md:p-6">
    <div className="font-medium">Use the CLI</div>
    <div className="leading-relaxed text-muted-foreground">
      Scaffold a supported template directly from the terminal.
    </div>
  </LinkedCard>
  <LinkedCard
    href="#existing-project"
    className="items-start gap-1 p-6 text-sm md:p-6"
  >
    <div className="font-medium">Existing Project</div>
    <div className="leading-relaxed text-muted-foreground">
      Add shadcn/ui to an app you already created.
    </div>
  </LinkedCard>
</div>

<div id="use-create" className="scroll-mt-24" />
## Use shadcn/create

Build your preset visually, preview your choices, and generate a framework-specific setup command.

<Button asChild size="sm">
  <Link
    href="/create"
    target="_blank"
    rel="noopener noreferrer"
    className="mt-6 no-underline!"
  >
    Open shadcn/create
  </Link>
</Button>

Available for Next.js, Vite, Laravel, React Router, Astro, and TanStack Start.

<div id="use-cli" className="scroll-mt-24" />
## Use the CLI

Use the CLI to scaffold a new project directly from the terminal:

```bash
npx shadcn@latest init -t [framework]
```

Supported templates: `next`, `vite`, `start`, `react-router`, and `astro`.

For Laravel, create the app first with `laravel new`, then run `npx shadcn@latest init`.

<div id="existing-project" className="scroll-mt-24" />
## Existing Project

Each framework guide includes an `Existing Project` section with the manual setup steps for that framework.

Pick your framework below and follow that path.

## Choose Your Framework

For Laravel, start with `laravel new` before using `shadcn/create` or `shadcn init`.

<div className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-6">
  <LinkedCard href="/docs/installation/next">
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className="h-10 w-10"
      fill="currentColor"
    >
      <title>Next.js</title>
      <path d="M11.5725 0c-.1763 0-.3098.0013-.3584.0067-.0516.0053-.2159.021-.3636.0328-3.4088.3073-6.6017 2.1463-8.624 4.9728C1.1004 6.584.3802 8.3666.1082 10.255c-.0962.659-.108.8537-.108 1.7474s.012 1.0884.108 1.7476c.652 4.506 3.8591 8.2919 8.2087 9.6945.7789.2511 1.6.4223 2.5337.5255.3636.04 1.9354.04 2.299 0 1.6117-.1783 2.9772-.577 4.3237-1.2643.2065-.1056.2464-.1337.2183-.1573-.0188-.0139-.8987-1.1938-1.9543-2.62l-1.919-2.592-2.4047-3.5583c-1.3231-1.9564-2.4117-3.556-2.4211-3.556-.0094-.0026-.0187 1.5787-.0235 3.509-.0067 3.3802-.0093 3.5162-.0516 3.596-.061.115-.108.1618-.2064.2134-.075.0374-.1408.0445-.495.0445h-.406l-.1078-.068a.4383.4383 0 01-.1572-.1712l-.0493-.1056.0053-4.703.0067-4.7054.0726-.0915c.0376-.0493.1174-.1125.1736-.143.0962-.047.1338-.0517.5396-.0517.4787 0 .5584.0187.6827.1547.0353.0377 1.3373 1.9987 2.895 4.3608a10760.433 10760.433 0 004.7344 7.1706l1.9002 2.8782.096-.0633c.8518-.5536 1.7525-1.3418 2.4657-2.1627 1.5179-1.7429 2.4963-3.868 2.8247-6.134.0961-.6591.1078-.854.1078-1.7475 0-.8937-.012-1.0884-.1078-1.7476-.6522-4.506-3.8592-8.2919-8.2087-9.6945-.7672-.2487-1.5836-.42-2.4985-.5232-.169-.0176-1.0835-.0366-1.6123-.037zm4.0685 7.217c.3473 0 .4082.0053.4857.047.1127.0562.204.1642.237.2767.0186.061.0234 1.3653.0186 4.3044l-.0067 4.2175-.7436-1.14-.7461-1.14v-3.066c0-1.982.0093-3.0963.0234-3.1502.0375-.1313.1196-.2346.2323-.2955.0961-.0494.1313-.054.4997-.054z" />
    </svg>
    <p className="mt-2 font-medium">Next.js</p>
  </LinkedCard>
  <LinkedCard href="/docs/installation/vite">
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className="h-10 w-10"
      fill="currentColor"
    >
      <title>Vite</title>
      <path d="m8.286 10.578.512-8.657a.306.306 0 0 1 .247-.282L17.377.006a.306.306 0 0 1 .353.385l-1.558 5.403a.306.306 0 0 0 .352.385l2.388-.46a.306.306 0 0 1 .332.438l-6.79 13.55-.123.19a.294.294 0 0 1-.252.14c-.177 0-.35-.152-.305-.369l1.095-5.301a.306.306 0 0 0-.388-.355l-1.433.435a.306.306 0 0 1-.389-.354l.69-3.375a.306.306 0 0 0-.37-.36l-2.32.536a.306.306 0 0 1-.374-.316zm14.976-7.926L17.284 3.74l-.544 1.887 2.077-.4a.8.8 0 0 1 .84.369.8.8 0 0 1 .034.783L12.9 19.93l-.013.025-.015.023-.122.19a.801.801 0 0 1-.672.37.826.826 0 0 1-.634-.302.8.8 0 0 1-.16-.67l1.029-4.981-1.12.34a.81.81 0 0 1-.86-.262.802.802 0 0 1-.165-.67l.63-3.08-2.027.468a.808.808 0 0 1-.768-.233.81.81 0 0 1-.217-.6l.389-6.57-7.44-1.33a.612.612 0 0 0-.64.906L11.58 23.691a.612.612 0 0 0 1.066-.004l11.26-20.135a.612.612 0 0 0-.644-.9z" />
    </svg>
    <p className="mt-2 font-medium">Vite</p>
  </LinkedCard>

<LinkedCard href="/docs/installation/tanstack">
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className="h-10 w-10"
    fill="currentColor"
  >
    <path d="M6.93 13.688a.343.343 0 0 1 .468.132l.063.106c.48.851.98 1.66 1.5 2.426a35.65 35.65 0 0 0 2.074 2.742.345.345 0 0 1-.039.484l-.074.066c-2.543 2.223-4.191 2.665-4.953 1.333-.746-1.305-.477-3.672.808-7.11a.344.344 0 0 1 .153-.18ZM17.75 16.3a.34.34 0 0 1 .395.27l.02.1c.628 3.286.187 4.93-1.325 4.93-1.48 0-3.36-1.402-5.649-4.203a.327.327 0 0 1-.074-.222c0-.188.156-.34.344-.34h.121a32.984 32.984 0 0 0 2.809-.098c1.07-.086 2.191-.23 3.359-.437zm.871-6.977a.353.353 0 0 1 .445-.21l.102.034c3.262 1.11 4.504 2.332 3.719 3.664-.766 1.305-2.993 2.254-6.684 2.848a.362.362 0 0 1-.238-.047.343.343 0 0 1-.125-.476l.062-.106a34.07 34.07 0 0 0 1.367-2.523c.477-.989.93-2.051 1.352-3.184zM7.797 8.34a.362.362 0 0 1 .238.047.343.343 0 0 1 .125.476l-.062.106a34.088 34.088 0 0 0-1.367 2.523c-.477.988-.93 2.051-1.352 3.184a.353.353 0 0 1-.445.21l-.102-.034C1.57 13.742.328 12.52 1.113 11.188 1.88 9.883 4.106 8.934 7.797 8.34Zm5.281-3.984c2.543-2.223 4.192-2.664 4.953-1.332.746 1.304.477 3.671-.808 7.109a.344.344 0 0 1-.153.18.343.343 0 0 1-.468-.133l-.063-.106a34.64 34.64 0 0 0-1.5-2.426 35.65 35.65 0 0 0-2.074-2.742.345.345 0 0 1 .039-.484ZM7.285 2.274c1.48 0 3.364 1.402 5.649 4.203a.349.349 0 0 1 .078.218.348.348 0 0 1-.348.344l-.117-.004a34.584 34.584 0 0 0-2.809.102 35.54 35.54 0 0 0-3.363.437.343.343 0 0 1-.394-.273l-.02-.098c-.629-3.285-.188-4.93 1.324-4.93Zm2.871 5.812h3.688a.638.638 0 0 1 .55.316l1.848 3.22a.644.644 0 0 1 0 .628l-1.847 3.223a.638.638 0 0 1-.551.316h-3.688a.627.627 0 0 1-.547-.316L7.758 12.25a.644.644 0 0 1 0-.629L9.61 8.402a.627.627 0 0 1 .546-.316Zm3.23.793a.638.638 0 0 1 .552.316l1.39 2.426a.644.644 0 0 1 0 .629l-1.39 2.43a.638.638 0 0 1-.551.316h-2.774a.627.627 0 0 1-.546-.316l-1.395-2.43a.644.644 0 0 1 0-.629l1.395-2.426a.627.627 0 0 1 .546-.316Zm-.491.867h-1.79a.624.624 0 0 0-.546.316l-.899 1.56a.644.644 0 0 0 0 .628l.899 1.563a.632.632 0 0 0 .547.316h1.789a.632.632 0 0 0 .547-.316l.898-1.563a.644.644 0 0 0 0-.629l-.898-1.558a.624.624 0 0 0-.547-.317Zm-.477.828c.227 0 .438.121.547.317l.422.73a.625.625 0 0 1 0 .629l-.422.734a.627.627 0 0 1-.547.317h-.836a.632.632 0 0 1-.547-.317l-.422-.734a.625.625 0 0 1 0-.629l.422-.73a.632.632 0 0 1 .547-.317zm-.418.817a.548.548 0 0 0-.473.273.547.547 0 0 0 0 .547.544.544 0 0 0 .473.27.544.544 0 0 0 .473-.27.547.547 0 0 0 0-.547.548.548 0 0 0-.473-.273Zm-4.422.546h.98M18.98 7.75c.391-1.895.477-3.344.223-4.398-.148-.63-.422-1.137-.84-1.508-.441-.39-1-.582-1.625-.582-1.035 0-2.12.472-3.281 1.367a14.9 14.9 0 0 0-1.473 1.316 1.206 1.206 0 0 0-.136-.144c-1.446-1.285-2.66-2.082-3.7-2.39-.617-.184-1.195-.2-1.722-.024-.559.187-1.004.574-1.317 1.117-.515.894-.652 2.074-.46 3.527.078.59.214 1.235.402 1.934a1.119 1.119 0 0 0-.215.047C3.008 8.62 1.71 9.269.926 10.015c-.465.442-.77.938-.883 1.481-.113.578 0 1.156.312 1.7.516.894 1.465 1.597 2.817 2.155.543.223 1.156.426 1.844.61a1.023 1.023 0 0 0-.07.226c-.391 1.891-.477 3.344-.223 4.395.148.629.425 1.14.84 1.508.44.39 1 .582 1.625.582 1.035 0 2.12-.473 3.28-1.364.477-.37.973-.816 1.489-1.336a1.2 1.2 0 0 0 .195.227c1.446 1.285 2.66 2.082 3.7 2.39.617.184 1.195.2 1.722.024.559-.187 1.004-.574 1.317-1.117.515-.894.652-2.074.46-3.527a14.941 14.941 0 0 0-.425-2.012 1.225 1.225 0 0 0 .238-.047c1.828-.61 3.125-1.258 3.91-2.004.465-.441.77-.937.883-1.48.113-.578 0-1.157-.313-1.7-.515-.894-1.464-1.597-2.816-2.156a14.576 14.576 0 0 0-1.906-.625.865.865 0 0 0 .059-.195z" />
  </svg>
  <p className="mt-2 font-medium">TanStack Start</p>
</LinkedCard>
<LinkedCard href="/docs/installation/laravel">
  <svg
    role="img"
    viewBox="0 0 62 65"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className="h-10 w-10"
  >
    <path d="M61.8548 14.6253C61.8778 14.7102 61.8895 14.7978 61.8897 14.8858V28.5615C61.8898 28.737 61.8434 28.9095 61.7554 29.0614C61.6675 29.2132 61.5409 29.3392 61.3887 29.4265L49.9104 36.0351V49.1337C49.9104 49.4902 49.7209 49.8192 49.4118 49.9987L25.4519 63.7916C25.3971 63.8227 25.3372 63.8427 25.2774 63.8639C25.255 63.8714 25.2338 63.8851 25.2101 63.8913C25.0426 63.9354 24.8666 63.9354 24.6991 63.8913C24.6716 63.8838 24.6467 63.8689 24.6205 63.8589C24.5657 63.8389 24.5084 63.8215 24.456 63.7916L0.501061 49.9987C0.348882 49.9113 0.222437 49.7853 0.134469 49.6334C0.0465019 49.4816 0.000120578 49.3092 0 49.1337L0 8.10652C0 8.01678 0.0124642 7.92953 0.0348998 7.84477C0.0423783 7.8161 0.0598282 7.78993 0.0697995 7.76126C0.0884958 7.70891 0.105946 7.65531 0.133367 7.6067C0.152063 7.5743 0.179485 7.54812 0.20192 7.51821C0.230588 7.47832 0.256763 7.43719 0.290416 7.40229C0.319084 7.37362 0.356476 7.35243 0.388883 7.32751C0.425029 7.29759 0.457436 7.26518 0.498568 7.2415L12.4779 0.345059C12.6296 0.257786 12.8015 0.211853 12.9765 0.211853C13.1515 0.211853 13.3234 0.257786 13.475 0.345059L25.4531 7.2415H25.4556C25.4955 7.26643 25.5292 7.29759 25.5653 7.32626C25.5977 7.35119 25.6339 7.37362 25.6625 7.40104C25.6974 7.43719 25.7224 7.47832 25.7523 7.51821C25.7735 7.54812 25.8021 7.5743 25.8196 7.6067C25.8483 7.65656 25.8645 7.70891 25.8844 7.76126C25.8944 7.78993 25.9118 7.8161 25.9193 7.84602C25.9423 7.93096 25.954 8.01853 25.9542 8.10652V33.7317L35.9355 27.9844V14.8846C35.9355 14.7973 35.948 14.7088 35.9704 14.6253C35.9792 14.5954 35.9954 14.5692 36.0053 14.5405C36.0253 14.4882 36.0427 14.4346 36.0702 14.386C36.0888 14.3536 36.1163 14.3274 36.1375 14.2975C36.1674 14.2576 36.1923 14.2165 36.2272 14.1816C36.2559 14.1529 36.292 14.1317 36.3244 14.1068C36.3618 14.0769 36.3942 14.0445 36.4341 14.0208L48.4147 7.12434C48.5663 7.03694 48.7383 6.99094 48.9133 6.99094C49.0883 6.99094 49.2602 7.03694 49.4118 7.12434L61.3899 14.0208C61.4323 14.0457 61.4647 14.0769 61.5021 14.1055C61.5333 14.1305 61.5694 14.1529 61.5981 14.1803C61.633 14.2165 61.6579 14.2576 61.6878 14.2975C61.7103 14.3274 61.7377 14.3536 61.7551 14.386C61.7838 14.4346 61.8 14.4882 61.8199 14.5405C61.8312 14.5692 61.8474 14.5954 61.8548 14.6253ZM59.893 27.9844V16.6121L55.7013 19.0252L49.9104 22.3593V33.7317L59.8942 27.9844H59.893ZM47.9149 48.5566V37.1768L42.2187 40.4299L25.953 49.7133V61.2003L47.9149 48.5566ZM1.99677 9.83281V48.5566L23.9562 61.199V49.7145L12.4841 43.2219L12.4804 43.2194L12.4754 43.2169C12.4368 43.1945 12.4044 43.1621 12.3682 43.1347C12.3371 43.1097 12.3009 43.0898 12.2735 43.0624L12.271 43.0586C12.2386 43.0275 12.2162 42.9888 12.1887 42.9539C12.1638 42.9203 12.1339 42.8916 12.114 42.8567L12.1127 42.853C12.0903 42.8156 12.0766 42.7707 12.0604 42.7283C12.0442 42.6909 12.023 42.656 12.013 42.6161C12.0005 42.5688 11.998 42.5177 11.9931 42.4691C11.9881 42.4317 11.9781 42.3943 11.9781 42.3569V15.5801L6.18848 12.2446L1.99677 9.83281ZM12.9777 2.36177L2.99764 8.10652L12.9752 13.8513L22.9541 8.10527L12.9752 2.36177H12.9777ZM18.1678 38.2138L23.9574 34.8809V9.83281L19.7657 12.2459L13.9749 15.5801V40.6281L18.1678 38.2138ZM48.9133 9.14105L38.9344 14.8858L48.9133 20.6305L58.8909 14.8846L48.9133 9.14105ZM47.9149 22.3593L42.124 19.0252L37.9323 16.6121V27.9844L43.7219 31.3174L47.9149 33.7317V22.3593ZM24.9533 47.987L39.59 39.631L46.9065 35.4555L36.9352 29.7145L25.4544 36.3242L14.9907 42.3482L24.9533 47.987Z" />
  </svg>
  <p className="mt-2 font-medium">Laravel</p>
</LinkedCard>
<LinkedCard href="/docs/installation/react-router">
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className="h-10 w-10"
    fill="currentColor"
  >
    <path d="M12.118 5.466a2.306 2.306 0 0 0-.623.08c-.278.067-.702.332-.953.583-.41.423-.49.609-.662 1.469-.08.423.41 1.43.847 1.734.45.317 1.085.502 2.065.608 1.429.16 1.84.636 1.84 2.197 0 1.377-.385 1.747-1.96 1.906-1.707.172-2.58.834-2.765 2.117-.106.781.41 1.76 1.125 2.091 1.627.768 3.15-.198 3.467-2.196.211-1.284.622-1.642 1.998-1.747 1.588-.133 2.409-.675 2.713-1.787.278-1.02-.304-2.157-1.297-2.554-.264-.106-.873-.238-1.35-.291-1.495-.16-1.879-.424-2.038-1.39-.225-1.337-.317-1.562-.794-2.09a2.174 2.174 0 0 0-1.613-.73zm-4.785 4.36a2.145 2.145 0 0 0-.497.048c-1.469.318-2.17 2.051-1.35 3.295 1.178 1.774 3.944.953 3.97-1.177.012-1.193-.98-2.143-2.123-2.166zM2.089 14.19a2.22 2.22 0 0 0-.427.052c-2.158.476-2.237 3.626-.106 4.182.53.145.582.145 1.111.013 1.191-.318 1.866-1.456 1.549-2.607-.278-1.02-1.144-1.664-2.127-1.64zm19.824.008c-.233.002-.477.058-.784.162-1.39.477-1.866 2.092-.98 3.336.557.794 1.96 1.058 2.82.516 1.416-.874 1.363-3.057-.093-3.746-.38-.186-.663-.271-.963-.268z" />
  </svg>
  <p className="mt-2 font-medium">React Router</p>
</LinkedCard>
<LinkedCard href="/docs/installation/astro">
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    className="h-10 w-10"
    fill="currentColor"
  >
    <title>Astro</title>
    <path
      d="M16.074 16.86C15.354 17.476 13.917 17.895 12.262 17.895C10.23 17.895 8.527 17.263 8.075 16.412C7.914 16.9 7.877 17.458 7.877 17.814C7.877 17.814 7.771 19.564 8.988 20.782C8.988 20.15 9.501 19.637 10.133 19.637C11.216 19.637 11.215 20.582 11.214 21.349V21.418C11.214 22.582 11.925 23.579 12.937 24C12.7812 23.6794 12.7005 23.3275 12.701 22.971C12.701 21.861 13.353 21.448 14.111 20.968C14.713 20.585 15.383 20.161 15.844 19.308C16.0926 18.8493 16.2225 18.3357 16.222 17.814C16.2221 17.4903 16.1722 17.1685 16.074 16.86ZM15.551 0.6C15.747 0.844 15.847 1.172 16.047 1.829L20.415 16.176C18.7743 15.3246 17.0134 14.7284 15.193 14.408L12.35 4.8C12.3273 4.72337 12.2803 4.65616 12.2162 4.60844C12.152 4.56072 12.0742 4.53505 11.9943 4.53528C11.9143 4.5355 11.8366 4.56161 11.7727 4.60969C11.7089 4.65777 11.6623 4.72524 11.64 4.802L8.83 14.405C7.00149 14.724 5.23264 15.3213 3.585 16.176L7.974 1.827C8.174 1.171 8.274 0.843 8.471 0.6C8.64406 0.385433 8.86922 0.218799 9.125 0.116C9.415 0 9.757 0 10.443 0H13.578C14.264 0 14.608 0 14.898 0.117C15.1529 0.219851 15.3783 0.386105 15.551 0.6Z"
      fill="currentColor"
    />
  </svg>
  <p className="mt-2 font-medium">Astro</p>
</LinkedCard>
  <LinkedCard href="/docs/installation/manual">
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className="h-10 w-10"
      fill="currentColor"
    >
      <title>React</title>
      <path d="M14.23 12.004a2.236 2.236 0 0 1-2.235 2.236 2.236 2.236 0 0 1-2.236-2.236 2.236 2.236 0 0 1 2.235-2.236 2.236 2.236 0 0 1 2.236 2.236zm2.648-10.69c-1.346 0-3.107.96-4.888 2.622-1.78-1.653-3.542-2.602-4.887-2.602-.41 0-.783.093-1.106.278-1.375.793-1.683 3.264-.973 6.365C1.98 8.917 0 10.42 0 12.004c0 1.59 1.99 3.097 5.043 4.03-.704 3.113-.39 5.588.988 6.38.32.187.69.275 1.102.275 1.345 0 3.107-.96 4.888-2.624 1.78 1.654 3.542 2.603 4.887 2.603.41 0 .783-.09 1.106-.275 1.374-.792 1.683-3.263.973-6.365C22.02 15.096 24 13.59 24 12.004c0-1.59-1.99-3.097-5.043-4.032.704-3.11.39-5.587-.988-6.38-.318-.184-.688-.277-1.092-.278zm-.005 1.09v.006c.225 0 .406.044.558.127.666.382.955 1.835.73 3.704-.054.46-.142.945-.25 1.44-.96-.236-2.006-.417-3.107-.534-.66-.905-1.345-1.727-2.035-2.447 1.592-1.48 3.087-2.292 4.105-2.295zm-9.77.02c1.012 0 2.514.808 4.11 2.28-.686.72-1.37 1.537-2.02 2.442-1.107.117-2.154.298-3.113.538-.112-.49-.195-.964-.254-1.42-.23-1.868.054-3.32.714-3.707.19-.09.4-.127.563-.132zm4.882 3.05c.455.468.91.992 1.36 1.564-.44-.02-.89-.034-1.345-.034-.46 0-.915.01-1.36.034.44-.572.895-1.096 1.345-1.565zM12 8.1c.74 0 1.477.034 2.202.093.406.582.802 1.203 1.183 1.86.372.64.71 1.29 1.018 1.946-.308.655-.646 1.31-1.013 1.95-.38.66-.773 1.288-1.18 1.87-.728.063-1.466.098-2.21.098-.74 0-1.477-.035-2.202-.093-.406-.582-.802-1.204-1.183-1.86-.372-.64-.71-1.29-1.018-1.946.303-.657.646-1.313 1.013-1.954.38-.66.773-1.286 1.18-1.868.728-.064 1.466-.098 2.21-.098zm-3.635.254c-.24.377-.48.763-.704 1.16-.225.39-.435.782-.635 1.174-.265-.656-.49-1.31-.676-1.947.64-.15 1.315-.283 2.015-.386zm7.26 0c.695.103 1.365.23 2.006.387-.18.632-.405 1.282-.66 1.933-.2-.39-.41-.783-.64-1.174-.225-.392-.465-.774-.705-1.146zm3.063.675c.484.15.944.317 1.375.498 1.732.74 2.852 1.708 2.852 2.476-.005.768-1.125 1.74-2.857 2.475-.42.18-.88.342-1.355.493-.28-.958-.646-1.956-1.1-2.98.45-1.017.81-2.01 1.085-2.964zm-13.395.004c.278.96.645 1.957 1.1 2.98-.45 1.017-.812 2.01-1.086 2.964-.484-.15-.944-.318-1.37-.5-1.732-.737-2.852-1.706-2.852-2.474 0-.768 1.12-1.742 2.852-2.476.42-.18.88-.342 1.356-.494zm11.678 4.28c.265.657.49 1.312.676 1.948-.64.157-1.316.29-2.016.39.24-.375.48-.762.705-1.158.225-.39.435-.788.636-1.18zm-9.945.02c.2.392.41.783.64 1.175.23.39.465.772.705 1.143-.695-.102-1.365-.23-2.006-.386.18-.63.406-1.282.66-1.933zM17.92 16.32c.112.493.2.968.254 1.423.23 1.868-.054 3.32-.714 3.708-.147.09-.338.128-.563.128-1.012 0-2.514-.807-4.11-2.28.686-.72 1.37-1.536 2.02-2.44 1.107-.118 2.154-.3 3.113-.54zm-11.83.01c.96.234 2.006.415 3.107.532.66.905 1.345 1.727 2.035 2.446-1.595 1.483-3.092 2.295-4.11 2.295-.22-.005-.406-.05-.553-.132-.666-.38-.955-1.834-.73-3.703.054-.46.142-.944.25-1.438zm4.56.64c.44.02.89.034 1.345.034.46 0 .915-.01 1.36-.034-.44.572-.895 1.095-1.345 1.565-.455-.47-.91-.993-1.36-1.565z" />
    </svg>
    <p className="mt-2 font-medium">Manual</p>
  </LinkedCard>
</div>
Components

    Accordion
    Alert
    Alert Dialog
    Aspect Ratio
    Attachment
    Avatar
    Badge
    Breadcrumb
    Bubble
    Button
    Button Group
    Calendar
    Card
    Carousel
    Chart
    Checkbox
    Code Block
    Collapsible
    Combobox
    Command
    Context Menu
    Data Table
    Date Picker
    Dialog
    Direction
    Drawer
    Dropdown Menu
    Empty
    Field
    Hover Card
    Input
    Input Group
    Input OTP
    Item
    Kbd
    Label
    Marker
    Menubar
    Message
    Message Scroller
    Native Select
    Navigation Menu
    Pagination
    Popover
    Progress
    Questionnaire
    Radio Group
    Resizable
    Scroll Area
    Select
    Separator
    Sheet
    Sidebar
    Skeleton
    Slider
    Spinner
    Switch
    Table
    Tabs
    Textarea
    Toast
    Toggle
    Toggle Group
    Tooltip
    Trace
    Typography

AI Elements

    Introduction
    Chain of Thought
    Chat
    Checkpoint
    Confirmation
    Context
    File Tree
    Inline Citation
    Message
    Model Selector
    Plan
    Prompt Input
    Queue
    Reasoning
    Sources
    Stack Trace
    Subagent
    Suggestion
    Task
    Terminal
    Test Results
    Tool