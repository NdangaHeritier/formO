# Formo: A Self-Hosted Email Platform for Developers and Non-Developers

Formo is a comprehensive, self-hosted email platform designed to empower both developers and non-developers with a versatile solution for managing email communications. Built with [Next.js](https://nextjs.org/), it offers a modern, efficient framework for both the frontend and backend, ensuring a seamless user experience. Developers can leverage Formo’s email API, located at `/api/send-email/route.ts`, to integrate email sending capabilities into their applications. This API utilizes [Nodemailer](https://nodemailer.com/) to send emails via SMTP, ensuring secure and reliable delivery. Data management is facilitated by [PocketBase](https://pocketbase.io/), a self-hosted backend solution that stores user data, email logs, and other operational records, accessible through the `lib/pocketbase.ts` module. For non-developers, such as marketers or business owners, Formo provides an intuitive dashboard at `/dashboard/non-dev/page.tsx`, where they can choose from a selection of pre-built email templates stored in the `emails/` directory, customize them with their content, and send emails to their audiences without requiring any technical expertise. The platform includes dedicated dashboards for both user types—`/dashboard/dev/page.tsx` for developers to manage API keys and logs, and `/dashboard/non-dev/page.tsx` for non-developers to handle template customization and sending. Additionally, Formo supports form submissions through the `/api/forms/[formId]/route.ts` endpoint, allowing users to process and respond to form data seamlessly. As a fully self-hosted solution, Formo ensures users maintain complete control over their email infrastructure and data privacy, making it ideal for those prioritizing security and independence from third-party services. With its scalable architecture and dual focus on technical flexibility and user-friendly design, Formo is a comprehensive solution for anyone looking to take charge of their email communications.

## Purpose
Formo’s primary goal is to provide a flexible, privacy-focused email platform that caters to two distinct audiences:
- **Developers**: Those who need a robust, customizable email API to integrate into their applications, with full control over the infrastructure.
- **Non-Developers**: Marketers, educators, or business owners who want to send professional emails using pre-built templates without coding.

By being self-hosted, Formo eliminates reliance on third-party email services, reducing costs and enhancing data security. It’s designed to scale from small personal projects to large enterprise solutions.

## Technology Stack
The following table outlines the core technologies used in Formo:

| **Component**            | **Technology**       | **Purpose**                                                                 |
|--------------------------|---------------------|-----------------------------------------------------------------------------|
| Frontend & Backend       | Next.js             | Powers the web application, including API routes and dashboards.            |
| Email Sending            | Nodemailer          | Sends emails via SMTP, ensuring secure and reliable delivery.               |
| Data Storage             | PocketBase          | Self-hosted backend for storing user data, email logs, and form submissions.|
| Authentication           | Next.js (Custom)    | Manages user login and access to dashboards (`/login/page.tsx`).           |
| Email Templates          | React Email         | Pre-built templates stored in `emails/` for non-developer customization.    |
| Form Handling            | Next.js API Routes  | Processes form submissions via `/api/forms/[formId]/route.ts`.             |

## Project Structure
Formo’s architecture is organized to support its dual-purpose functionality. Key components include:

- **Landing Page**: `/app/page.tsx` – A homepage showcasing solutions, features, and how it works for both audiences.
- **Login/Auth UI**: `/app/login/page.tsx` – Entry point for user authentication.
- **Developer Dashboard**: `/app/developer/page.tsx` – Interface for managing API keys, viewing logs, and configuring settings.
- **Non-Developer Dashboard**: `/app/templates/page.tsx` – Interface for selecting, customizing, and sending email templates.
- **Email Templates**: `/emails/` – Directory containing pre-built templates (e.g., `Newsletter.tsx`, `Announcement.tsx`) for non-developers.
- **Email API**: `/app/api/send-email/route.ts` – Endpoint for sending emails programmatically.
- **Form Submission API**: `/app/api/forms/[formId]/route.ts` – Endpoint for handling form submissions.
- **PocketBase Integration**: `/lib/pocketbase.ts` – Client for interacting with the PocketBase backend.
- **Mailer Setup**: `/lib/mailer.ts` – Configures Nodemailer for email sending.

## Features for Developers
- **Email API**: Integrate email sending into your apps using a simple POST request to `/api/send-email/route.ts`. Example:
  ```javascript
  await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: 'recipient@example.com', subject: 'Hello', text: 'Hi!' })
  });
  ```
- **Dashboard**: Manage API keys, view email logs, and monitor usage at `/dashboard/dev/page.tsx`.
- **Self-Hosted**: Run Formo on your own servers, ensuring data privacy and control.
- **Form Handling**: Process form submissions via `/api/forms/[formId]/route.ts`, ideal for contact forms or feedback systems.

## Features for Non-Developers
- **Template Library**: Choose from 5-7 pre-built email templates in `/emails/`, customizable with text and paragraphs.
- **Dashboard**: Use `/dashboard NONDEV/page.tsx` to edit templates and send emails without coding.
- **Future Enhancements**: Upcoming features include color and font variants for templates, enhancing customization options.

## Why Formo?
Formo stands out due to its:
- **Dual Focus**: Caters to both technical and non-technical users.
- **Self-Hosted Nature**: Eliminates third-party dependencies, reducing costs and enhancing privacy.
- **Scalability**: Suitable for small projects to large-scale enterprise needs.
- **Security**: Built with secure practices, including token-based authentication and rate limiting.

## Getting Started
To set up Formo:
1. Clone the repository (placeholder: [GitHub](https://github.com/NdangaHeritier/formo)).
2. Install dependencies: `npm install`.
3. Configure environment variables for SMTP and PocketBase in `.env`.
4. Run locally: `npm run dev`.

For detailed setup instructions, refer to the [Next.js documentation](https://nextjs.org/docs) or [PocketBase documentation](https://pocketbase.io/docs).

## Future Plans
Formo is set to expand with:
- Advanced analytics for email tracking (e.g., opens, clicks).
- Enhanced template customization (color/font variants).
- Multi-recipient support for form submissions (upcoming Pro version).

This platform is designed to be a developer-friendly, privacy-focused solution that bridges the gap between technical and non-technical email needs. Whether you’re building an app or sending newsletters, Formo has you covered.