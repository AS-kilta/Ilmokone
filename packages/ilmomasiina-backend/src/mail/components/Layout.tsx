import type { PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";

import config from "../../config";
import type { PngTextOptions } from "../pngText";
import PngText from "./PngText";

export interface LayoutProps extends PropsWithChildren {
  alertVariant?: "alert-good" | "alert-neutral" | "alert-warning" | "alert-bad";
  alertText?: string;
  alertOptions?: PngTextOptions;
}

export default function Layout({ children, alertVariant, alertText, alertOptions }: LayoutProps) {
  const {
    i18n: { language },
  } = useTranslation();
  return (
    <html lang={language} {...{ xmlns: "http://www.w3.org/1999/xhtml" }}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>AS Ilmokone</title>
        <link href="styles.css" rel="stylesheet" type="text/css" data-inline />
      </head>
      <body itemScope itemType="http://schema.org/EmailMessage">
        <table className="body-wrap" width="100%" cellPadding={0} cellSpacing={0} border={0}>
          <tbody>
            <tr>
              <td className="container" width={600} align="center">
                <div className="content">
                  <table className="header" width="100%" cellPadding={0} cellSpacing={0} border={0}>
                    <tbody>
                      <tr>
                        <td className="align-center">
                          <div className="headerTitle">
                            <PngText text="AS Ilmokone" font="anta" fontSize={48} color="#ffffff" />
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="content">
                  <table className="main" width="100%" cellPadding={0} cellSpacing={0} border={0}>
                    <tbody>
                      {alertText && (
                        <tr>
                          <td className={`alert ${alertVariant || "alert-neutral"}`}>
                            <div className="alertText">
                              <PngText
                                text={alertText}
                                font={alertOptions?.font ?? "jacquard"}
                                fontSize={alertOptions?.fontSize ?? 34}
                                color="#ffffff"
                              />
                            </div>
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td className="content-wrap">
                          <table width="100%" cellPadding={0} cellSpacing={0} border={0}>
                            <tbody>{children}</tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  {(config.brandingMailFooterText || config.brandingMailFooterLink) && (
                    <div className="footer">
                      <table width="100%" cellPadding={0} cellSpacing={0} border={0}>
                        <tbody>
                          <tr>
                            <td className="align-center content-block">
                              {config.brandingMailFooterText && (
                                <p className="footerText">{config.brandingMailFooterText}</p>
                              )}
                              {config.brandingMailFooterLink && (
                                <p className="footerText">
                                  <a className="footerLink" href={config.brandingMailFooterLink}>
                                    {config.brandingMailFooterLink.replace(/^https?:\/\//, "")}
                                  </a>
                                </p>
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}
