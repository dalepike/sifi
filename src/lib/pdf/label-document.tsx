import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

/**
 * Avery 5160 Label Layout
 * 30 labels per sheet (3 columns x 10 rows)
 * Label size: 2.625" x 1" (66.7mm x 25.4mm)
 * Page margins: 0.5" top/bottom, 0.1875" left/right
 */

const styles = StyleSheet.create({
  page: {
    paddingTop: 36, // 0.5 inch
    paddingBottom: 36,
    paddingLeft: 13.5, // 0.1875 inch
    paddingRight: 13.5,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  label: {
    width: 189, // 2.625 inches at 72dpi
    height: 72, // 1 inch at 72dpi
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
    borderWidth: 0.5,
    borderColor: "#e5e5e5",
    borderStyle: "dashed",
  },
  qrCode: {
    width: 56,
    height: 56,
  },
  textContainer: {
    flex: 1,
    marginLeft: 6,
    justifyContent: "center",
  },
  name: {
    fontSize: 8,
    fontWeight: "bold",
    marginBottom: 2,
  },
  code: {
    fontSize: 7,
    fontFamily: "Courier",
    color: "#666",
  },
  uuid: {
    fontSize: 5,
    fontFamily: "Courier",
    color: "#999",
    marginTop: 2,
  },
});

export interface LabelData {
  itemId: string;
  name: string;
  humanReadableCode: string;
  qrDataUrl: string;
}

interface LabelDocumentProps {
  labels: LabelData[];
}

function Label({ label }: { label: LabelData }) {
  return (
    <View style={styles.label}>
      <Image style={styles.qrCode} src={label.qrDataUrl} />
      <View style={styles.textContainer}>
        <Text style={styles.name}>{label.name}</Text>
        <Text style={styles.code}>{label.humanReadableCode}</Text>
        <Text style={styles.uuid}>{label.itemId.substring(0, 8)}</Text>
      </View>
    </View>
  );
}

export function LabelDocument({ labels }: LabelDocumentProps) {
  // Split labels into pages of 30
  const pages: LabelData[][] = [];
  for (let i = 0; i < labels.length; i += 30) {
    pages.push(labels.slice(i, i + 30));
  }

  return (
    <Document>
      {pages.map((pageLabels, pageIndex) => (
        <Page key={pageIndex} size="LETTER" style={styles.page}>
          {pageLabels.map((label) => (
            <Label key={label.itemId} label={label} />
          ))}
        </Page>
      ))}
    </Document>
  );
}
