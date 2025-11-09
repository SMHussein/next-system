import { eq } from "drizzle-orm";
import db from "@/db";
import { articles } from "@/db/schema";
import resend from "@/email";
import CelebrationTemplate from "./templates/celebration-template";

const BASE_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export default async function sendCelebrationEmail(
  articleId: string,
  pageViews: number,
) {
  try {
    const response = await db.query.articles.findFirst({
      where: eq(articles.id, articleId),
      with: {
        user: { columns: { name: true, email: true, id: true } },
      },
    });

    if (!response || !response.user) throw new Error("Article not found");

    const { name, id } = response.user;

    if (!name) throw new Error("Name not found");

    // OPTION 1: this only works if you've set up your own custom domain on Resend like I have
    // const emailRes = await resend.emails.send({
    //   from: 'Wikimasters <noreply@mail.holt.courses>', // should be your domain
    //   to: email,
    //   subject: `✨ You article got ${pageviews} views! ✨`,
    //   html: "<h1>Congrats!</h1><p>You're an amazing author!</p>",
    // });

    const emailRes = await resend.emails.send({
      from: "Wikimasters <onboarding@resend.dev>", // I believe it only lets you send from Resend if you haven't set up your domain
      to: "saifabobahjat@gmail.com",
      subject: `✨ You article got ${pageViews} views! ✨`,
      react: (
        <CelebrationTemplate
          name={name}
          pageviews={pageViews}
          articleTitle={response.title}
          articleUrl={BASE_URL}
        />
      ),
    });

    if (!emailRes.error) {
      return console.log(
        `✉️ Email was send to ${id} about celebration page views`,
      );
    }

    return console.log(
      `❌ Issue sending an email to ${id} about celebration page views ${emailRes.error}`,
    );
  } catch (e) {
    console.error(e);
  }
}
