import VideoEditor from "./components/VideoEditor";
import { ChakraProvider } from "@chakra-ui/react";
import { YosoThemeProvider } from "yoso-ui";

function App() {
  return (
    <YosoThemeProvider>
      <ChakraProvider>
        <VideoEditor />
      </ChakraProvider>
    </YosoThemeProvider>
  );
}

export default App;
