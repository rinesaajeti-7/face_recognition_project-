from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.db.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.services.report_service import AIReportService
from fastapi.responses import StreamingResponse
import io

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("/summary")
def get_summary_report(
    period: str = Query("monthly", regex="^(daily|weekly|monthly|yearly)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get AI-generated summary report"""
    try:
        service = AIReportService(db)
        report = service.generate_summary_report(period)
        return report
    except Exception as e:
        print(f"Error in summary report: {e}")
        return {"error": str(e), "statistics": {}, "insights": ["Unable to generate report"], "trends": []}


@router.get("/performance")
def get_performance_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get system performance report"""
    try:
        service = AIReportService(db)
        report = service.generate_performance_report()
        return report
    except Exception as e:
        print(f"Error in performance report: {e}")
        return {"error": str(e)}


@router.get("/export/pdf")
def export_report_pdf(
    report_type: str = Query("summary", regex="^(summary|performance)$"),
    period: str = Query("monthly", regex="^(daily|weekly|monthly|yearly)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Export report as PDF"""
    try:
        service = AIReportService(db)
        
        if report_type == "summary":
            report_data = service.generate_summary_report(period)
        else:
            report_data = service.generate_performance_report()
        
        pdf_bytes = service.export_to_pdf(report_data, report_type)
        
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=report_{report_type}_{period}.pdf"}
        )
    except Exception as e:
        print(f"Error exporting PDF: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/export/excel")
def export_report_excel(
    report_type: str = Query("summary", regex="^(summary|performance)$"),
    period: str = Query("monthly", regex="^(daily|weekly|monthly|yearly)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Export report as Excel"""
    try:
        service = AIReportService(db)
        
        if report_type == "summary":
            report_data = service.generate_summary_report(period)
        else:
            report_data = service.generate_performance_report()
        
        excel_bytes = service.export_to_excel(report_data, report_type)
        
        return StreamingResponse(
            io.BytesIO(excel_bytes),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=report_{report_type}_{period}.xlsx"}
        )
    except Exception as e:
        print(f"Error exporting Excel: {e}")
        raise HTTPException(status_code=500, detail=str(e))