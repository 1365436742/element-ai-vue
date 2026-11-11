# DrawingML preset geometry provenance

`presets.ts` contains 187 preset definitions mechanically transformed from Apache POI 5.4.1's `presetShapeDefinitions.xml`:

https://github.com/apache/poi/blob/REL_5_4_1/poi/src/main/resources/org/apache/poi/sl/draw/geom/presetShapeDefinitions.xml

Source SHA-256: `a7dad593d27bd70536b41da9b761fa16409536cc0c25ef2b6c7a61c5d9b3e738`.

Apache POI is licensed under Apache License 2.0, which permits commercial use and redistribution subject to its terms. The complete license is included as `LICENSE-APACHE-2.0.txt`; the upstream POI NOTICE is preserved as `NOTICE-APACHE-POI.txt`. Only geometry defaults, formula guides, text rectangles and path commands were retained; connection sites, handles and whitespace were omitted. No proprietary SDK or paid dependency is used.

The evaluator is original TypeScript. Formula semantics were verified against the primary Apache POI 5.4.1 `GuideIf.java` and `BuiltInGuide.java`; non-square ellipse radial angle semantics against `ArcToCommand.java`, at the same source tag:

- https://github.com/apache/poi/blob/REL_5_4_1/poi/src/main/java/org/apache/poi/sl/draw/geom/GuideIf.java
- https://github.com/apache/poi/blob/REL_5_4_1/poi/src/main/java/org/apache/poi/sl/draw/geom/BuiltInGuide.java
- https://github.com/apache/poi/blob/REL_5_4_1/poi/src/main/java/org/apache/poi/sl/draw/geom/ArcToCommand.java

The generated representation has entries keyed by preset name, adjustment/default guides (`av`), calculated guides (`gd`), a text rectangle (`rect`), and paths containing attributes and command tuples `[localName, attributes, childPointAttributes]`. It preserves formulas and path attributes verbatim. The original user presentation is not included.

Per-path coordinate contexts and omitted-extent EMU conversion were additionally verified against `DrawSimpleShape.computeOutlines`:
https://github.com/apache/poi/blob/REL_5_4_1/poi/src/main/java/org/apache/poi/sl/draw/DrawSimpleShape.java
