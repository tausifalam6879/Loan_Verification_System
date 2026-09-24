import React from "react";
import { Box, Typography } from "@mui/material";

export default function WorkspaceHeading({ title, subtitle, children }) {
  return (
    <Box className="workspace-heading">
      <Box sx={{ position: "relative", zIndex: 1 }}>
        <Typography variant="h4" component="h1">{title}</Typography>
        <Typography sx={{ mt: 0.65, color: "text.secondary", fontSize: { xs: 14, md: 17 } }}>{subtitle}</Typography>
      </Box>
      <Box className="workspace-heading-art" aria-hidden="true">
        <svg viewBox="0 0 320 110" fill="none"><path d="M0 110 Q35 55 65 76 T130 62 T190 30 T245 65 T320 110Z" fill="currentColor" /></svg>
      </Box>
      {children && <Box sx={{ position: "relative", zIndex: 1 }}>{children}</Box>}
    </Box>
  );
}
