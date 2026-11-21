# CDIUnit JSON Schema (v1.0) - Reference

Fields:
- model_id (string) - unique id
- manufacturer (string)
- pin_count (integer)
- wire_colors_map (object) - keys like PIN_1 -> hex color
- expected_spark_output (string)
- test_sequences (array)
  - each test: test_id, test_type ("RESISTANCE"), pin_A_data, pin_B_data, expected_value { nominal_ohms, tolerance_percent }
